import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { config } from './config';

export type CloudinaryResult = {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export type PickedImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

/**
 * Unsigned upload to the same Cloudinary account/preset the web app uses.
 * Works on both web (blob) and native (file uri) targets.
 */
export async function uploadToCloudinary(image: PickedImage): Promise<CloudinaryResult> {
  const url = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`;
  const json = Platform.OS === 'web' ? await uploadWeb(url, image) : await uploadNative(url, image);
  return {
    publicId: json.public_id,
    secureUrl: webDeliverable(json.secure_url, json.format),
    width: json.width,
    height: json.height,
    format: json.format,
    bytes: json.bytes,
  };
}

async function uploadWeb(url: string, image: PickedImage): Promise<any> {
  // On web the picker returns a blob:/data: uri we materialise into a Blob.
  const blob = await (await fetch(image.uri)).blob();
  const form = new FormData();
  form.append('file', blob, image.fileName || `upload-${Date.now()}.jpg`);
  form.append('upload_preset', config.cloudinary.uploadPreset);
  form.append('folder', config.cloudinary.folder);
  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json();
}

async function uploadNative(url: string, image: PickedImage): Promise<any> {
  // RN/Expo SDK 56's fetch rejects the legacy { uri,name,type } FormData part
  // ("Unsupported FormDataPart implementation"). expo-file-system's multipart
  // uploadAsync streams the local file correctly instead.
  const name = image.fileName || image.uri.split('/').pop() || `upload-${Date.now()}.jpg`;
  const result = await FileSystem.uploadAsync(url, image.uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType: image.mimeType || guessMime(name),
    parameters: {
      upload_preset: config.cloudinary.uploadPreset,
      folder: config.cloudinary.folder,
    },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Cloudinary ${result.status}: ${result.body?.slice(0, 200)}`);
  }
  return JSON.parse(result.body);
}

function guessMime(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    default:
      return 'image/jpeg';
  }
}

/**
 * HEIC/HEIF are not web-deliverable; force Cloudinary to transcode on the fly,
 * matching the web app's fix (f_auto,q_auto).
 */
function webDeliverable(secureUrl: string, format: string): string {
  const f = (format || '').toLowerCase();
  if (f === 'heic' || f === 'heif') {
    return secureUrl.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return secureUrl;
}
