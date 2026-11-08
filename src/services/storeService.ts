// src/services/storeService.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Product, Store } from '@/types';

export type StoreInput = Omit<Store, 'id' | 'ownerId'>;
export type ProductInput = Omit<Product, 'id' | 'storeId'>;

export function toStore(id: string, data: Record<string, unknown>): Store {
  return {
    id,
    ownerId: String(data.ownerId ?? ''),
    directoryOnly: data.directoryOnly === true,
    sourceUrl: typeof data.sourceUrl === 'string' ? data.sourceUrl : '',
    name: String(data.name ?? ''),
    address: String(data.address ?? ''),
    municipality: String(data.municipality ?? ''),
    lat: Number(data.lat),
    lng: Number(data.lng),
    phone: String(data.phone ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
  };
}

export function toProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    storeId: String(data.storeId ?? ''),
    name: String(data.name ?? ''),
    price: Number(data.price),
    description: String(data.description ?? ''),
    category: String(data.category ?? 'Other'),
    imageUrl: String(data.imageUrl ?? ''),
  };
}

export async function listStores(municipality?: string): Promise<Store[]> {
  const storesQuery = municipality
    ? query(collection(db, 'stores'), where('municipality', '==', municipality))
    : collection(db, 'stores');
  const [partnerResult, directoryResult] = await Promise.all([
    getDocs(storesQuery),
    getDocs(collection(db, 'directoryStores')),
  ]);
  const directoryStores = directoryResult.docs
    .map((snapshot) => toStore(snapshot.id, snapshot.data()))
    .filter((store) => !municipality || store.municipality.toLocaleLowerCase() === municipality.toLocaleLowerCase());
  return [
    ...partnerResult.docs.map((snapshot) => toStore(snapshot.id, snapshot.data())),
    ...directoryStores,
  ];
}

export async function getStore(storeId: string): Promise<Store | null> {
  const partnerSnapshot = await getDoc(doc(db, 'stores', storeId));
  if (partnerSnapshot.exists()) return toStore(partnerSnapshot.id, partnerSnapshot.data());

  const directorySnapshot = await getDoc(doc(db, 'directoryStores', storeId));
  return directorySnapshot.exists()
    ? toStore(directorySnapshot.id, directorySnapshot.data())
    : null;
}

export async function getOwnerStore(ownerId: string): Promise<Store | null> {
  const snapshot = await getDoc(doc(db, 'stores', ownerId));
  return snapshot.exists() ? toStore(snapshot.id, snapshot.data()) : null;
}

export async function saveOwnerStore(
  ownerId: string,
  input: StoreInput,
): Promise<void> {
  await setDoc(doc(db, 'stores', ownerId), { ...input, ownerId });
}

export async function deleteOwnerStore(ownerId: string): Promise<void> {
  const store = await getOwnerStore(ownerId);
  if (!store) return;

  const [products, orders] = await Promise.all([
    getDocs(query(collection(db, 'products'), where('storeId', '==', store.id))),
    getDocs(query(collection(db, 'orders'), where('storeId', '==', store.id))),
  ]);
  if (!products.empty || !orders.empty) {
    throw new Error('A store with products or order history cannot be deleted.');
  }

  await deleteDoc(doc(db, 'stores', store.id));
}

export async function listProducts(storeId: string): Promise<Product[]> {
  const result = await getDocs(
    query(collection(db, 'products'), where('storeId', '==', storeId)),
  );
  return result.docs.map((snapshot) => toProduct(snapshot.id, snapshot.data()));
}

export async function getProduct(productId: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, 'products', productId));
  return snapshot.exists() ? toProduct(snapshot.id, snapshot.data()) : null;
}

export async function createProduct(
  storeId: string,
  input: ProductInput,
): Promise<string> {
  const result = await addDoc(collection(db, 'products'), { ...input, storeId });
  return result.id;
}

export async function updateProduct(
  productId: string,
  input: ProductInput,
): Promise<void> {
  const existing = await getDoc(doc(db, 'products', productId));
  if (!existing.exists()) throw new Error('This product no longer exists.');
  await updateDoc(doc(db, 'products', productId), input);
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}
