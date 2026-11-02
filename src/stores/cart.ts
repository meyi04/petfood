import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  unitPrice: number;
  imageUrl: string;
  quantity: number;
}

const storagePrefix = 'petfood:cart:';
const maxProductsPerStore = 20;

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.productId === 'string'
    && item.productId.length > 0
    && typeof item.storeId === 'string'
    && item.storeId.length > 0
    && typeof item.name === 'string'
    && typeof item.unitPrice === 'number'
    && Number.isFinite(item.unitPrice)
    && item.unitPrice > 0
    && typeof item.imageUrl === 'string'
    && Number.isSafeInteger(item.quantity)
    && (item.quantity as number) > 0;
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const buyerId = ref('');
  const error = ref('');
  const itemCount = computed(() =>
    items.value.reduce((total, item) => total + item.quantity, 0),
  );
  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  );

  function loadForBuyer(userId: string): void {
    if (!userId || buyerId.value === userId) return;
    buyerId.value = userId;
    error.value = '';
    try {
      const saved = localStorage.getItem(`${storagePrefix}${userId}`);
      if (!saved) {
        items.value = [];
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
        throw new Error('Saved cart data is invalid.');
      }
      items.value = parsed;
    } catch {
      items.value = [];
      error.value = 'Could not restore your saved cart. You can clear it and start a new cart.';
    }
  }

  function save(nextItems: CartItem[]): void {
    if (!buyerId.value) throw new Error('Sign in again before changing your cart.');
    try {
      localStorage.setItem(`${storagePrefix}${buyerId.value}`, JSON.stringify(nextItems));
      items.value = nextItems;
      error.value = '';
    } catch {
      error.value = 'Could not save your cart on this device. Check available browser storage and try again.';
      throw new Error(error.value);
    }
  }

  function addItem(item: CartItem): void {
    if (!isCartItem(item)) throw new Error('This product cannot be added to the cart.');
    const existingIndex = items.value.findIndex(
      (saved) => saved.productId === item.productId && saved.storeId === item.storeId,
    );
    if (existingIndex < 0) {
      const storeProductCount = items.value.filter((saved) => saved.storeId === item.storeId).length;
      if (storeProductCount >= maxProductsPerStore) {
        throw new Error(`A cart can contain up to ${maxProductsPerStore} different products from one store.`);
      }
    }

    const nextItems = [...items.value];
    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        ...item,
        quantity: nextItems[existingIndex].quantity + item.quantity,
      };
    } else {
      nextItems.push(item);
    }
    save(nextItems);
  }

  function setQuantity(productId: string, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a whole number greater than zero.');
    }
    const nextItems = items.value.map((item) =>
      item.productId === productId ? { ...item, quantity } : item,
    );
    if (!nextItems.some((item) => item.productId === productId)) return;
    save(nextItems);
  }

  function updateProducts(
    updates: Array<Pick<CartItem, 'productId' | 'storeId' | 'name' | 'unitPrice' | 'imageUrl'>>,
  ): void {
    const updateById = new Map(updates.map((item) => [item.productId, item]));
    save(items.value.map((item) => {
      const update = updateById.get(item.productId);
      return update ? { ...item, ...update } : item;
    }));
  }

  function removeItem(productId: string): void {
    save(items.value.filter((item) => item.productId !== productId));
  }

  function removeItems(productIds: string[]): void {
    const productIdSet = new Set(productIds);
    save(items.value.filter((item) => !productIdSet.has(item.productId)));
  }

  function clear(): void {
    save([]);
  }

  return {
    items,
    buyerId,
    error,
    itemCount,
    total,
    loadForBuyer,
    addItem,
    setQuantity,
    updateProducts,
    removeItem,
    removeItems,
    clear,
  };
});
