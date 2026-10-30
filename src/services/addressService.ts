import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { DeliveryAddress, DeliveryAddressDetails } from '@/types';

export type DeliveryAddressInput = DeliveryAddressDetails & { isDefault: boolean };

const addressFields: Array<keyof DeliveryAddressDetails> = [
  'label',
  'recipientName',
  'phone',
  'streetAddress',
  'barangay',
  'municipality',
  'province',
  'postalCode',
  'deliveryInstructions',
];

const addressMaxLengths: Record<keyof DeliveryAddressDetails, number> = {
  label: 32,
  recipientName: 100,
  phone: 32,
  streetAddress: 200,
  barangay: 100,
  municipality: 100,
  province: 100,
  postalCode: 16,
  deliveryInstructions: 300,
};

const requiredAddressFields: Array<keyof DeliveryAddressDetails> = [
  'label',
  'recipientName',
  'phone',
  'streetAddress',
  'barangay',
  'municipality',
  'province',
];

function addressesCollection(userId: string) {
  return collection(db, 'users', userId, 'deliveryAddresses');
}

function addressDocument(userId: string, addressId: string) {
  return doc(db, 'users', userId, 'deliveryAddresses', addressId);
}

function toDeliveryAddress(id: string, data: DocumentData): DeliveryAddress {
  return {
    id,
    label: String(data.label ?? ''),
    recipientName: String(data.recipientName ?? ''),
    phone: String(data.phone ?? ''),
    streetAddress: String(data.streetAddress ?? ''),
    barangay: String(data.barangay ?? ''),
    municipality: String(data.municipality ?? ''),
    province: String(data.province ?? ''),
    postalCode: String(data.postalCode ?? ''),
    deliveryInstructions: String(data.deliveryInstructions ?? ''),
    isDefault: data.isDefault === true,
  };
}

function validateAddress(input: DeliveryAddressInput): void {
  for (const field of addressFields) {
    const value = input[field];
    if (
      typeof value !== 'string' ||
      (requiredAddressFields.includes(field) && value.trim().length === 0)
    ) {
      throw new Error(`${fieldLabel(field)} is required.`);
    }
    if (value.trim().length > addressMaxLengths[field]) {
      throw new Error(`${fieldLabel(field)} must be ${addressMaxLengths[field]} characters or fewer.`);
    }
  }
  if (typeof input.isDefault !== 'boolean') {
    throw new Error('Choose whether this is your default delivery address.');
  }
}

function fieldLabel(field: keyof DeliveryAddressDetails): string {
  const labels: Record<keyof DeliveryAddressDetails, string> = {
    label: 'Address label',
    recipientName: 'Recipient name',
    phone: 'Phone number',
    streetAddress: 'Street address',
    barangay: 'Barangay',
    municipality: 'City or municipality',
    province: 'Province',
    postalCode: 'Postal code',
    deliveryInstructions: 'Delivery instructions',
  };
  return labels[field];
}

function addressData(input: DeliveryAddressInput) {
  return {
    label: input.label.trim(),
    recipientName: input.recipientName.trim(),
    phone: input.phone.trim(),
    streetAddress: input.streetAddress.trim(),
    barangay: input.barangay.trim(),
    municipality: input.municipality.trim(),
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    deliveryInstructions: input.deliveryInstructions.trim(),
    isDefault: input.isDefault,
  };
}

export async function listDeliveryAddresses(userId: string): Promise<DeliveryAddress[]> {
  if (!userId) throw new Error('Sign in to view your delivery addresses.');
  const result = await getDocs(addressesCollection(userId));
  return result.docs
    .map((snapshot) => toDeliveryAddress(snapshot.id, snapshot.data()))
    .sort((first, second) => Number(second.isDefault) - Number(first.isDefault));
}

export async function createDeliveryAddress(
  userId: string,
  input: DeliveryAddressInput,
): Promise<string> {
  if (!userId) throw new Error('Sign in to save a delivery address.');
  validateAddress(input);

  const existing = await getDocs(addressesCollection(userId));
  const makeDefault = input.isDefault || existing.empty;
  const reference = doc(addressesCollection(userId));
  const batch = writeBatch(db);
  if (makeDefault) {
    for (const snapshot of existing.docs) {
      if (snapshot.data().isDefault === true) {
        batch.update(snapshot.ref, { isDefault: false });
      }
    }
  }
  batch.set(reference, { ...addressData(input), isDefault: makeDefault });
  await batch.commit();
  return reference.id;
}

export async function updateDeliveryAddress(
  userId: string,
  addressId: string,
  input: DeliveryAddressInput,
): Promise<void> {
  if (!userId || !addressId) throw new Error('Select a delivery address to update.');
  validateAddress(input);

  const existing = await getDocs(addressesCollection(userId));
  const target = existing.docs.find((snapshot) => snapshot.id === addressId);
  if (!target) throw new Error('This delivery address no longer exists.');

  const batch = writeBatch(db);
  if (input.isDefault) {
    for (const snapshot of existing.docs) {
      if (snapshot.id !== addressId && snapshot.data().isDefault === true) {
        batch.update(snapshot.ref, { isDefault: false });
      }
    }
  }
  batch.update(target.ref, { ...addressData(input), isDefault: input.isDefault });
  await batch.commit();
}

export async function deleteDeliveryAddress(
  userId: string,
  addressId: string,
): Promise<void> {
  if (!userId || !addressId) throw new Error('Select a delivery address to delete.');

  const existing = await getDocs(addressesCollection(userId));
  const target = existing.docs.find((snapshot) => snapshot.id === addressId);
  if (!target) throw new Error('This delivery address no longer exists.');

  const remaining = existing.docs.filter((snapshot) => snapshot.id !== addressId);
  const batch = writeBatch(db);
  batch.delete(addressDocument(userId, addressId));
  if (target.data().isDefault === true && remaining.length > 0) {
    batch.update(remaining[0].ref, { isDefault: true });
  }
  await batch.commit();
}

export function formatDeliveryAddress(address: DeliveryAddressDetails): string {
  return [
    address.streetAddress,
    address.barangay,
    address.municipality,
    address.province,
    address.postalCode,
  ].filter(Boolean).join(', ');
}
