// src/services/orderService.ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type {
  DeliveryAddressDetails,
  OrderItem,
  OrderStatus,
  PetFoodOrder,
} from '@/types';

export async function placeOrder(
  buyerId: string,
  storeId: string,
  items: OrderItem[],
  deliveryAddress: DeliveryAddressDetails,
): Promise<string> {
  if (items.length === 0) throw new Error('An order must contain at least one item.');
  if (
    !deliveryAddress.recipientName.trim() ||
    !deliveryAddress.phone.trim() ||
    !deliveryAddress.streetAddress.trim() ||
    !deliveryAddress.barangay.trim() ||
    !deliveryAddress.municipality.trim() ||
    !deliveryAddress.province.trim()
  ) {
    throw new Error('A complete delivery address is required to place this order.');
  }
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Each item quantity must be a whole number greater than zero.');
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
      throw new Error('Each item must have a valid price greater than zero.');
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('The order total must be greater than zero.');
  }

  const result = await addDoc(collection(db, 'orders'), {
    buyerId,
    storeId,
    items,
    total,
    deliveryAddress,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return result.id;
}

export async function listStoreOrders(storeId: string): Promise<PetFoodOrder[]> {
  const result = await getDocs(
    query(collection(db, 'orders'), where('storeId', '==', storeId)),
  );
  return result.docs.map(toPetFoodOrder).sort(sortOrdersByDate);
}

export function subscribeToStoreOrders(
  storeId: string,
  onOrders: (orders: PetFoodOrder[]) => void,
  onError: (cause: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'orders'), where('storeId', '==', storeId)),
    (result) => onOrders(result.docs.map(toPetFoodOrder).sort(sortOrdersByDate)),
    onError,
  );
}

export async function listBuyerOrders(buyerId: string): Promise<PetFoodOrder[]> {
  const result = await getDocs(
    query(collection(db, 'orders'), where('buyerId', '==', buyerId)),
  );
  return result.docs.map(toPetFoodOrder).sort(sortOrdersByDate);
}

function toPetFoodOrder(snapshot: { id: string; data(): Record<string, unknown> }): PetFoodOrder {
  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<PetFoodOrder, 'id'>),
  };
}

function sortOrdersByDate(first: PetFoodOrder, second: PetFoodOrder): number {
  const firstDate = first.createdAt?.toMillis?.() ?? 0;
  const secondDate = second.createdAt?.toMillis?.() ?? 0;
  return secondDate - firstDate;
}

export async function updateStoreOrderStatus(
  order: PetFoodOrder,
  nextStatus: OrderStatus,
): Promise<void> {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!allowedTransitions[order.status].includes(nextStatus)) {
    throw new Error(`An order cannot move from ${order.status} to ${nextStatus}.`);
  }

  await updateDoc(doc(db, 'orders', order.id), {
    status: nextStatus,
    ...(nextStatus === 'confirmed' ? { confirmedAt: serverTimestamp() } : {}),
    ...(nextStatus === 'completed' ? { completedAt: serverTimestamp() } : {}),
  });
}
