import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';

import { BarcodeScannerService, BarcodeScanResult } from '../../../core/services/barcode-scanner.service';
import { ViewportService } from '../../../core/services/viewport.service';

/**
 * Barcode Scanner Component
 * Feature: F-025 Mobile-Optimized Interface
 *
 * Provides a mobile-friendly camera scanner dialog for barcode/IMEI scanning.
 * Optimized for touch interaction with large tap targets.
 */
@Component({
  selector: 'app-barcode-scanner',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    MessageModule,
    ProgressSpinnerModule,
    TooltipModule
  ],
  templateUrl: './barcode-scanner.component.html',
  styleUrls: ['./barcode-scanner.component.scss']
})
export class BarcodeScannerComponent implements OnDestroy {
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;

  @Input() buttonIcon = 'pi pi-camera';
  @Input() buttonLabel = 'Scan Barcode';
  @Input() buttonSeverity: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'help' | 'primary' | 'contrast' = 'secondary';
  @Input() buttonOutlined = false;
  @Input() buttonText = false;
  @Input() buttonRounded = false;
  @Input() buttonStyle: Record<string, string> = {};
  @Input() showLabel = true;
  @Input() tooltipText = 'Scan barcode with camera';
  @Input() dialogHeader = 'Scan Barcode';
  @Input() autoStart = true;
  @Input() closeOnScan = true;
  @Input() showLastScan = true;

  @Output() scanned = new EventEmitter<BarcodeScanResult>();
  @Output() dialogOpened = new EventEmitter<void>();
  @Output() dialogClosed = new EventEmitter<void>();

  constructor(
    public scannerService: BarcodeScannerService,
    public viewportService: ViewportService
  ) { }

  dialogVisible = false;
  initializing = signal(false);
  torchEnabled = signal(false);
  selectedCamera: string | null = null;

  cameraOptions = signal<Array<{ label: string; value: string }>>([]);

  ngOnDestroy(): void {
    this.stopScanning();
  }

  openScanner(): void {
    if (!this.scannerService.isBarcodeApiSupported()) return;

    this.dialogVisible = true;
    this.dialogOpened.emit();

    // Update camera options
    const cameras = this.scannerService.availableCameras();
    this.cameraOptions.set(
      cameras.map((c, i) => ({
        label: c.label || `Camera ${i + 1}`,
        value: c.deviceId
      }))
    );

    this.selectedCamera = this.scannerService.selectedCameraId();

    if (this.autoStart) {
      // Wait for dialog to render then start scanning
      setTimeout(() => this.startScanning(), 100);
    }
  }

  async startScanning(): Promise<void> {
    if (!this.videoElementRef?.nativeElement) return;

    this.initializing.set(true);

    const success = await this.scannerService.startScanning(
      this.videoElementRef.nativeElement,
      (result) => this.onBarcodeDetected(result)
    );

    this.initializing.set(false);

    if (success) {
      // Update camera options after getting permission
      const cameras = this.scannerService.availableCameras();
      this.cameraOptions.set(
        cameras.map((c, i) => ({
          label: c.label || `Camera ${i + 1}`,
          value: c.deviceId
        }))
      );
    }
  }

  stopScanning(): void {
    this.scannerService.stopScanning();
    this.torchEnabled.set(false);
  }

  onDialogHide(): void {
    this.stopScanning();
    this.scannerService.clearLastScan();
    this.dialogClosed.emit();
  }

  private onBarcodeDetected(result: BarcodeScanResult): void {
    this.scanned.emit(result);

    if (this.closeOnScan) {
      this.dialogVisible = false;
    }
  }

  async onCameraChange(deviceId: string): Promise<void> {
    await this.scannerService.switchCamera(deviceId);
  }

  async toggleTorch(): Promise<void> {
    const newState = !this.torchEnabled();
    const success = await this.scannerService.toggleTorch(newState);

    if (success) {
      this.torchEnabled.set(newState);
    }
  }
}
