// src/services/uploadService.ts
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { auth } from '@/firebase';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_FIRESTORE_IMAGE_LENGTH = 800 * 1024;
const MAX_IMAGE_DIMENSION = 1200;

export async function captureImageForFirestore(): Promise<string> {
  if (!auth.currentUser) throw new Error('Sign in before uploading an image.');

  const photo = await Camera.getPhoto({
    quality: 82,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
  });
  if (!photo.dataUrl) throw new Error('The camera did not return an image.');

  const image = await fetch(photo.dataUrl);
  return compressImageForFirestore(await image.blob());
}

export async function encodeImageFileForFirestore(file: File): Promise<string> {
  if (!auth.currentUser) throw new Error('Sign in before uploading an image.');
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Choose an image smaller than 5 MB.');
  }

  return compressImageForFirestore(file);
}

async function compressImageForFirestore(image: Blob): Promise<string> {
  const bitmap = await createImageBitmap(image);
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext('2d');
    if (!context) throw new Error('This device cannot process the selected image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const blob = await canvasToJpeg(canvas, Math.max(0.35, 0.78 - attempt * 0.08));
      const dataUrl = await blobToDataUrl(blob);
      if (dataUrl.length <= MAX_FIRESTORE_IMAGE_LENGTH) return dataUrl;

      if (attempt < 5) {
        canvas.width = Math.max(1, Math.round(canvas.width * 0.82));
        canvas.height = Math.max(1, Math.round(canvas.height * 0.82));
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      }
    }

    throw new Error('This image could not be compressed enough to fit in Firestore. Try a smaller image.');
  } finally {
    bitmap.close();
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the selected image.'));
    }, 'image/jpeg', quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the encoded image.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the encoded image.'));
    reader.readAsDataURL(blob);
  });
}
