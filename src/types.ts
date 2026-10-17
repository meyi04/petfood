// src/types.ts
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'OWNER' | 'BUYER';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  municipality: string;
  lat: number;
  lng: number;
  phone: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface PetFoodOrder {
  id: string;
  buyerId: string;
  storeId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
}

export const PRODUCT_CATEGORIES = [
  'Dog food',
  'Cat food',
  'Bird food',
  'Fish food',
  'Small animal food',
  'Treats',
  'Other',
] as const;
