import { Injectable, signal, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Supported barcode formats
 * Feature: F-025 Mobile-Optimized Interface
 */
export type BarcodeFormat =
  | 'code_128'
  | 'code_39'
  | 'ean_13'
  | 'ean_8'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'
  | 'itf';

export interface BarcodeScanResult {
  rawValue: string;
  format: BarcodeFormat | string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
}

export interface ScannerState {
  isScanning: boolean;
  hasPermission: boolean;
  permissionDenied: boolean;
  error: string | null;
  lastScan: BarcodeScanResult | null;
}

/**
 * Barcode Scanner Service
 * Feature: F-025 Mobile-Optimized Interface
 *
 * Provides camera-based barcode scanning for mobile POS operations.
 * Uses the BarcodeDetector API where available, with fallback messaging.
 */
@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private mediaStream: MediaStream | null = null;
  private barcodeDetector: BarcodeDetector | null = null;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private videoElement: HTMLVideoElement | null = null;

  readonly isScanning = signal(false);
  readonly hasPermission = signal(false);
  readonly permissionDenied = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastScan = signal<BarcodeScanResult | null>(null);
  readonly isBarcodeApiSupported = signal(false);
  readonly availableCameras = signal<MediaDeviceInfo[]>([]);
  readonly selectedCameraId = signal<string | null>(null);

  readonly scannerState = computed<ScannerState>(() => ({
    isScanning: this.isScanning(),
    hasPermission: this.hasPermission(),
    permissionDenied: this.permissionDenied(),
    error: this.error(),
    lastScan: this.lastScan()
  }));

  constructor() {
    if (this.isBrowser) {
      this.checkBarcodeApiSupport();
      this.enumerateCameras();
    }
  }

  private checkBarcodeApiSupport(): void {
    if ('BarcodeDetector' in window) {
      this.isBarcodeApiSupported.set(true);
      this.initBarcodeDetector();
    }
  }

  private async initBarcodeDetector(): Promise<void> {
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      this.barcodeDetector = new BarcodeDetector({
        formats: formats.length > 0 ? formats : ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39']
      });
    } catch (err) {
      console.error('Failed to initialize BarcodeDetector:', err);
      this.isBarcodeApiSupported.set(false);
    }
  }

  private async enumerateCameras(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      this.availableCameras.set(cameras);

      // Prefer back camera on mobile devices
      const backCamera = cameras.find(c =>
        c.label.toLowerCase().includes('back') ||
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      );

      if (backCamera) {
        this.selectedCameraId.set(backCamera.deviceId);
      } else if (cameras.length > 0) {
        this.selectedCameraId.set(cameras[0].deviceId);
      }
    } catch {
      // Camera enumeration may fail without permission
    }
  }

  /**
   * Request camera permission and start scanning
   */
  async startScanning(
    videoElement: HTMLVideoElement,
    onScan?: (result: BarcodeScanResult) => void
  ): Promise<boolean> {
    if (!this.isBrowser) {
      this.error.set('Scanning not supported in this environment');
      return false;
    }

    this.error.set(null);
    this.videoElement = videoElement;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // If a specific camera is selected, use it
      const selectedId = this.selectedCameraId();
      if (selectedId) {
        constraints.video = {
          deviceId: { exact: selectedId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.hasPermission.set(true);
      this.permissionDenied.set(false);

      videoElement.srcObject = this.mediaStream;
      await videoElement.play();

      this.isScanning.set(true);

      // Start barcode detection loop
      if (this.barcodeDetector) {
        this.startDetectionLoop(videoElement, onScan);
      }

      // Re-enumerate cameras now that we have permission
      await this.enumerateCameras();

      return true;
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        this.permissionDenied.set(true);
        this.error.set('Camera access denied. Please allow camera access to scan barcodes.');
      } else if (error.name === 'NotFoundError') {
        this.error.set('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        this.error.set('Camera is in use by another application.');
      } else {
        this.error.set(`Failed to access camera: ${error.message}`);
      }
      return false;
    }
  }

  private startDetectionLoop(
    videoElement: HTMLVideoElement,
    onScan?: (result: BarcodeScanResult) => void
  ): void {
    if (!this.barcodeDetector) return;

    const detect = async () => {
      if (!this.isScanning() || !this.barcodeDetector) return;

      try {
        if (videoElement.readyState >= 2) {
          const barcodes = await this.barcodeDetector.detect(videoElement);

          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            const result: BarcodeScanResult = {
              rawValue: barcode.rawValue,
              format: barcode.format,
              boundingBox: barcode.boundingBox,
              cornerPoints: barcode.cornerPoints
            };

            this.lastScan.set(result);

            if (onScan) {
              onScan(result);
            }
          }
        }
      } catch (err) {
        console.error('Barcode detection error:', err);
      }
    };

    // Run detection at ~15fps
    this.scanInterval = setInterval(detect, 66);
  }

  /**
   * Stop scanning and release camera
   */
  stopScanning(): void {
    this.isScanning.set(false);

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Switch to a different camera
   */
  async switchCamera(deviceId: string): Promise<boolean> {
    this.selectedCameraId.set(deviceId);

    if (this.isScanning() && this.videoElement) {
      this.stopScanning();
      return this.startScanning(this.videoElement);
    }

    return true;
  }

  /**
   * Toggle flashlight/torch if available
   */
  async toggleTorch(enabled: boolean): Promise<boolean> {
    if (!this.mediaStream) return false;

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    try {
      const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (!capabilities.torch) return false;

      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as MediaTrackConstraintSet & { torch: boolean }]
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear the last scan result
   */
  clearLastScan(): void {
    this.lastScan.set(null);
  }

  /**
   * Manually trigger a scan from an image
   */
  async scanFromImage(imageSource: ImageBitmapSource): Promise<BarcodeScanResult | null> {
    if (!this.barcodeDetector) {
      this.error.set('Barcode scanning not supported in this browser');
      return null;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(imageSource);

      if (barcodes.length > 0) {
        const barcode = barcodes[0];
        const result: BarcodeScanResult = {
          rawValue: barcode.rawValue,
          format: barcode.format,
          boundingBox: barcode.boundingBox,
          cornerPoints: barcode.cornerPoints
        };

        this.lastScan.set(result);
        return result;
      }

      return null;
    } catch (err) {
      const error = err as Error;
      this.error.set(`Scan failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if the current device supports barcode scanning
   */
  isSupported(): boolean {
    return this.isBrowser && this.isBarcodeApiSupported();
  }

  /**
   * Get supported barcode formats
   */
  async getSupportedFormats(): Promise<string[]> {
    if (!this.isBrowser || !('BarcodeDetector' in window)) {
      return [];
    }

    try {
      return await BarcodeDetector.getSupportedFormats();
    } catch {
      return [];
    }
  }
}

// TypeScript declarations for BarcodeDetector API
declare global {
  class BarcodeDetector {
    constructor(options?: { formats: string[] });
    static getSupportedFormats(): Promise<string[]>;
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }

  interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: { x: number; y: number }[];
  }
}
