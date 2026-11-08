import { beforeEach, describe, expect, test, vi } from 'vitest';

const { addDocMock, collectionMock, serverTimestampMock } = vi.hoisted(() => ({
  addDocMock: vi.fn(),
  collectionMock: vi.fn(),
  serverTimestampMock: vi.fn(() => 'server-timestamp'),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: addDocMock,
  collection: collectionMock,
  doc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  serverTimestamp: serverTimestampMock,
  updateDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock('@/firebase', () => ({ db: {} }));

import { placeOrder } from '@/services/orderService';

const orderItems = [{
  productId: 'product-1',
  name: 'Pet food',
  quantity: 2,
  unitPrice: 12.5,
}];

const deliveryAddress = {
  label: 'Home',
  recipientName: 'Buyer',
  phone: '09123456789',
  streetAddress: '1 Main Street',
  barangay: 'Central',
  municipality: 'Town',
  province: 'Province',
  postalCode: '',
  deliveryInstructions: '',
};

describe('placeOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectionMock.mockReturnValue('orders-collection');
    addDocMock.mockResolvedValue({ id: 'order-1' });
  });

  test('saves pickup orders without a delivery address', async () => {
    await placeOrder('buyer-1', 'store-1', orderItems, 'pickup');

    expect(addDocMock).toHaveBeenCalledWith('orders-collection', expect.objectContaining({
      buyerId: 'buyer-1',
      fulfillmentType: 'pickup',
    }));
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('deliveryAddress');
  });

  test('requires an address for delivery and saves it with the order', async () => {
    await expect(
      placeOrder('buyer-1', 'store-1', orderItems, 'delivery'),
    ).rejects.toThrow('Choose a delivery address');
    expect(addDocMock).not.toHaveBeenCalled();

    await placeOrder('buyer-1', 'store-1', orderItems, 'delivery', deliveryAddress);

    expect(addDocMock).toHaveBeenCalledWith('orders-collection', expect.objectContaining({
      fulfillmentType: 'delivery',
      deliveryAddress,
    }));
  });
});
