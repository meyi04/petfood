import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Product, Store, UserProfile, UserRole } from '@/types';
import { toPetFoodOrder } from '@/services/orderService';
import { toProduct, toStore } from '@/services/storeService';

export async function listAdminUsers(): Promise<UserProfile[]> {
  const result = await getDocs(collection(db, 'users'));
  return result.docs.map((snapshot) => {
    const data = snapshot.data();
    if (data.role !== 'OWNER' && data.role !== 'BUYER' && data.role !== 'ADMIN') {
      throw new Error(`Account ${snapshot.id} has an invalid role.`);
    }
    return {
      uid: snapshot.id,
      email: String(data.email ?? ''),
      displayName: String(data.displayName ?? ''),
      role: data.role as UserRole,
    };
  }).sort((first, second) => first.displayName.localeCompare(second.displayName));
}

export async function listAdminStores(): Promise<Store[]> {
  const result = await getDocs(collection(db, 'stores'));
  return result.docs.map((snapshot) => toStore(snapshot.id, snapshot.data()));
}

export async function listAdminProducts(): Promise<Product[]> {
  const result = await getDocs(collection(db, 'products'));
  return result.docs.map((snapshot) => toProduct(snapshot.id, snapshot.data()));
}

export async function listAdminOrders() {
  const result = await getDocs(collection(db, 'orders'));
  return result.docs.map(toPetFoodOrder).sort((first, second) =>
    (second.createdAt?.toMillis?.() ?? 0) - (first.createdAt?.toMillis?.() ?? 0),
  );
}

export async function updateAdminUserRole(userId: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { role });
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

export async function deleteAdminStore(storeId: string): Promise<void> {
  const [products, orders] = await Promise.all([
    getDocs(query(collection(db, 'products'), where('storeId', '==', storeId))),
    getDocs(query(collection(db, 'orders'), where('storeId', '==', storeId))),
  ]);
  if (!products.empty || !orders.empty) {
    throw new Error('This store has products or order history and cannot be removed.');
  }
  await deleteDoc(doc(db, 'stores', storeId));
}
