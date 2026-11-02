import { beforeEach, describe, expect, test } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCartStore, type CartItem } from '@/stores/cart';

const item: CartItem = {
  productId: 'product-1',
  storeId: 'store-1',
  name: 'Pet food',
  unitPrice: 12.5,
  imageUrl: '',
  quantity: 2,
};

describe('cart store', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  test('persists cart items for the signed-in buyer and merges matching products', () => {
    const cart = useCartStore();
    cart.loadForBuyer('buyer-1');
    cart.addItem(item);
    cart.addItem({ ...item, quantity: 1 });

    expect(cart.itemCount).toBe(3);
    expect(cart.total).toBe(37.5);

    const restoredCart = useCartStore();
    restoredCart.loadForBuyer('buyer-1');
    expect(restoredCart.items).toEqual([{ ...item, quantity: 3 }]);
  });

  test('keeps carts separate between buyers', () => {
    const cart = useCartStore();
    cart.loadForBuyer('buyer-1');
    cart.addItem(item);
    cart.loadForBuyer('buyer-2');

    expect(cart.items).toEqual([]);
  });

  test('updates quantities and removes ordered items', () => {
    const cart = useCartStore();
    cart.loadForBuyer('buyer-1');
    cart.addItem(item);
    cart.setQuantity('product-1', 4);
    cart.removeItems(['product-1']);

    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
  });

  test('rejects invalid quantities and more than 20 distinct products from one store', () => {
    const cart = useCartStore();
    cart.loadForBuyer('buyer-1');
    expect(() => cart.addItem({ ...item, quantity: 0 })).toThrow();
    for (let index = 1; index <= 20; index += 1) {
      cart.addItem({ ...item, productId: `product-${index}` });
    }
    expect(() => cart.addItem({ ...item, productId: 'product-21' })).toThrow(/up to 20/);
  });
});
