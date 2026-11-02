<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home" />
        </ion-buttons>
        <ion-title>Your cart</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">READY WHEN YOU ARE</p>
      <h1>Your cart</h1>
      <p class="intro">Review your items and send each store its own order.</p>

      <ion-text v-if="cart.error || loadError" color="danger">
        <p>{{ cart.error || loadError }}</p>
      </ion-text>
      <ion-button v-if="cart.error" fill="outline" @click="clearCart">
        Clear saved cart
      </ion-button>

      <section v-if="!cart.items.length && !cart.error" class="empty-state">
        <ion-icon :icon="cartOutline" />
        <h2>Your cart is empty</h2>
        <p>Browse a store and add your pet's favorites to the cart.</p>
        <ion-button router-link="/tabs/stores">Find a store</ion-button>
      </section>

      <template v-else-if="cart.items.length">
        <section class="delivery-panel">
          <div class="delivery-heading">
            <div>
              <span class="detail-label">DELIVER TO</span>
              <strong>Delivery address</strong>
            </div>
            <ion-button fill="clear" size="small" @click="manageAddresses">
              {{ addresses.length ? 'Manage' : 'Add address' }}
            </ion-button>
          </div>
          <ion-spinner v-if="addressesLoading" name="crescent" />
          <ion-text v-else-if="addressError" color="danger">
            <p>{{ addressError }}</p>
          </ion-text>
          <template v-else-if="addresses.length">
            <ion-select
              v-model="selectedAddressId"
              aria-label="Select delivery address"
              interface="popover"
            >
              <ion-select-option
                v-for="address in addresses"
                :key="address.id"
                :value="address.id"
              >
                {{ address.label }}{{ address.isDefault ? ' · Default' : '' }}
              </ion-select-option>
            </ion-select>
            <p v-if="selectedAddress" class="selected-address">
              {{ selectedAddress.recipientName }} · {{ formatDeliveryAddress(selectedAddress) }}
            </p>
          </template>
          <div v-else class="no-address">
            <p>Add a delivery address before placing an order.</p>
            <ion-button fill="outline" size="small" @click="manageAddresses">
              Add delivery address
            </ion-button>
          </div>
        </section>

        <ion-card v-for="group in cartGroups" :key="group.storeId" class="store-cart">
          <ion-card-header>
            <div class="store-heading">
              <div>
                <ion-card-subtitle>ORDER FROM</ion-card-subtitle>
                <ion-card-title>{{ storeNames[group.storeId] || 'Pet food store' }}</ion-card-title>
              </div>
              <ion-button
                fill="clear"
                color="danger"
                size="small"
                :disabled="orderingStoreId === group.storeId"
                @click="removeStoreItems(group)"
              >
                Remove all
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div v-for="item in group.items" :key="item.productId" class="cart-item">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
              <div v-else class="item-placeholder">
                <ion-icon :icon="bagHandleOutline" />
              </div>
              <div class="item-details">
                <strong>{{ item.name }}</strong>
                <span>{{ formatCurrency(item.unitPrice) }} each</span>
                <div class="quantity-control">
                  <ion-button
                    fill="outline"
                    size="small"
                    :aria-label="`Decrease ${item.name} quantity`"
                    :disabled="orderingStoreId === group.storeId || item.quantity <= 1"
                    @click="changeQuantity(item.productId, item.quantity - 1)"
                  >
                    <ion-icon slot="icon-only" :icon="removeOutline" />
                  </ion-button>
                  <span>{{ item.quantity }}</span>
                  <ion-button
                    fill="outline"
                    size="small"
                    :aria-label="`Increase ${item.name} quantity`"
                    :disabled="orderingStoreId === group.storeId"
                    @click="changeQuantity(item.productId, item.quantity + 1)"
                  >
                    <ion-icon slot="icon-only" :icon="addOutline" />
                  </ion-button>
                  <ion-button
                    fill="clear"
                    color="medium"
                    size="small"
                    :aria-label="`Remove ${item.name}`"
                    :disabled="orderingStoreId === group.storeId"
                    @click="removeItem(item.productId)"
                  >
                    <ion-icon slot="icon-only" :icon="trashOutline" />
                  </ion-button>
                </div>
              </div>
              <strong class="item-total">{{ formatCurrency(item.unitPrice * item.quantity) }}</strong>
            </div>

            <div class="store-total">
              <span>{{ group.items.length }} product{{ group.items.length === 1 ? '' : 's' }}</span>
              <strong>{{ formatCurrency(group.total) }}</strong>
            </div>
            <ion-text v-if="storeErrors[group.storeId]" color="danger">
              <p>{{ storeErrors[group.storeId] }}</p>
            </ion-text>
            <ion-button
              expand="block"
              :disabled="Boolean(orderingStoreId) || !selectedAddress || addressesLoading || Boolean(addressError) || !storeNames[group.storeId]"
              @click="placeStoreOrder(group)"
            >
              {{ orderingStoreId === group.storeId ? 'Placing order…' : `Place order · ${formatCurrency(group.total)}` }}
            </ion-button>
          </ion-card-content>
        </ion-card>
      </template>

      <ion-toast
        :is-open="Boolean(message)"
        :message="message"
        duration="3500"
        :color="messageColor"
        @did-dismiss="message = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  addOutline,
  bagHandleOutline,
  cartOutline,
  removeOutline,
  trashOutline,
} from 'ionicons/icons';
import { formatDeliveryAddress, listDeliveryAddresses } from '@/services/addressService';
import { placeOrder } from '@/services/orderService';
import { getProduct, getStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { useCartStore, type CartItem } from '@/stores/cart';
import { formatCurrency } from '@/utils/format';
import type { DeliveryAddress, DeliveryAddressDetails, OrderItem } from '@/types';

interface CartGroup {
  storeId: string;
  items: CartItem[];
  total: number;
}

const router = useRouter();
const authStore = useAuthStore();
const cart = useCartStore();
const addresses = ref<DeliveryAddress[]>([]);
const selectedAddressId = ref('');
const addressesLoading = ref(true);
const addressError = ref('');
const loadError = ref('');
const storeNames = ref<Record<string, string>>({});
const storeErrors = ref<Record<string, string>>({});
const orderingStoreId = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');

const selectedAddress = computed(() =>
  addresses.value.find((address) => address.id === selectedAddressId.value) ?? null,
);

const cartGroups = computed<CartGroup[]>(() => {
  const groups = new Map<string, CartItem[]>();
  for (const item of cart.items) {
    const group = groups.get(item.storeId) ?? [];
    group.push(item);
    groups.set(item.storeId, group);
  }
  return [...groups.entries()].map(([storeId, items]) => ({
    storeId,
    items,
    total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  }));
});

function manageAddresses(): void {
  void router.push('/tabs/account');
}

async function loadCartPage(): Promise<void> {
  const buyerId = authStore.profile?.uid;
  if (!buyerId) {
    loadError.value = 'Sign in again to view your cart.';
    addressesLoading.value = false;
    return;
  }
  cart.loadForBuyer(buyerId);
  loadError.value = '';
  addressesLoading.value = true;
  addressError.value = '';
  storeNames.value = {};
  storeErrors.value = {};
  try {
    const storeIds = [...new Set(cart.items.map((item) => item.storeId))];
    const [savedAddresses, stores] = await Promise.all([
      listDeliveryAddresses(buyerId),
      Promise.all(storeIds.map((id) => getStore(id))),
    ]);
    addresses.value = savedAddresses;
    selectedAddressId.value =
      savedAddresses.find((address) => address.id === selectedAddressId.value)?.id ??
      savedAddresses.find((address) => address.isDefault)?.id ??
      savedAddresses[0]?.id ??
      '';
    storeNames.value = Object.fromEntries(stores.flatMap((store) =>
      store && !store.directoryOnly ? [[store.id, store.name]] : [],
    ));
    storeErrors.value = Object.fromEntries(stores.flatMap((store, index) =>
      !store || store.directoryOnly
        ? [[storeIds[index], 'This store is no longer available for in-app orders.']]
        : [],
    ));
  } catch (cause) {
    loadError.value = cause instanceof Error ? cause.message : 'Could not load your cart details.';
  } finally {
    addressesLoading.value = false;
  }
}

function changeQuantity(productId: string, quantity: number): void {
  try {
    cart.setQuantity(productId, quantity);
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not update the cart.';
  }
}

function removeItem(productId: string): void {
  try {
    cart.removeItem(productId);
    messageColor.value = 'success';
    message.value = 'Item removed from your cart.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not update the cart.';
  }
}

function removeStoreItems(group: CartGroup): void {
  try {
    cart.removeItems(group.items.map((item) => item.productId));
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not remove these items.';
  }
}

function clearCart(): void {
  try {
    cart.clear();
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not clear the cart.';
  }
}

function addressDetails(address: DeliveryAddress): DeliveryAddressDetails {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    streetAddress: address.streetAddress,
    barangay: address.barangay,
    municipality: address.municipality,
    province: address.province,
    postalCode: address.postalCode,
    deliveryInstructions: address.deliveryInstructions,
  };
}

async function placeStoreOrder(group: CartGroup): Promise<void> {
  const buyerId = authStore.profile?.uid;
  const address = selectedAddress.value;
  if (!buyerId || !address || orderingStoreId.value) return;
  orderingStoreId.value = group.storeId;
  storeErrors.value = { ...storeErrors.value, [group.storeId]: '' };

  try {
    const store = await getStore(group.storeId);
    if (!store || store.directoryOnly) {
      throw new Error('This store is no longer available for in-app orders.');
    }
    if (group.items.length > 20) {
      throw new Error('An order can contain up to 20 different products from one store.');
    }
    const currentProducts = await Promise.all(group.items.map((item) => getProduct(item.productId)));
    if (currentProducts.some((product) => !product || product.storeId !== group.storeId)) {
      throw new Error('A product is no longer available from this store.');
    }
    const changedProducts = currentProducts.flatMap((product, index) => {
      const item = group.items[index];
      if (!product || (
        product.name === item.name &&
        product.price === item.unitPrice &&
        product.imageUrl === item.imageUrl
      )) return [];
      return [{
        productId: product.id,
        storeId: product.storeId,
        name: product.name,
        unitPrice: product.price,
        imageUrl: product.imageUrl,
      }];
    });
    if (changedProducts.length) {
      cart.updateProducts(changedProducts);
      throw new Error('Product details or prices changed. The cart has been updated; review it and place your order again.');
    }

    const orderItems: OrderItem[] = group.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
    await placeOrder(buyerId, store.id, orderItems, addressDetails(address));
    try {
      cart.removeItems(group.items.map((item) => item.productId));
      messageColor.value = 'success';
      message.value = `Your order was sent to ${store.name}.`;
    } catch {
      messageColor.value = 'danger';
      message.value = `Your order was sent to ${store.name}, but the cart could not be saved as cleared. Remove these items to avoid ordering them again.`;
    }
  } catch (cause) {
    storeErrors.value = {
      ...storeErrors.value,
      [group.storeId]: cause instanceof Error ? cause.message : 'Could not place this order.',
    };
  } finally {
    orderingStoreId.value = '';
  }
}

onIonViewWillEnter(loadCartPage);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--ion-color-primary);
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: 1.9rem;
  letter-spacing: -0.045em;
}

.intro {
  margin-top: 0.45rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.delivery-panel {
  padding: 1rem;
  margin: 1.25rem 0;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
  box-shadow: var(--app-shadow-soft);
}

.delivery-heading,
.store-heading,
.cart-item,
.store-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.delivery-heading {
  margin-bottom: 0.75rem;
}

.delivery-heading > div {
  display: grid;
  gap: 0.2rem;
}

.detail-label {
  color: var(--ion-color-medium);
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.selected-address {
  padding: 0.75rem;
  margin: 0.65rem 0 0;
  border-radius: 0.75rem;
  background: var(--app-surface-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.no-address p {
  color: var(--ion-color-medium);
}

.store-cart {
  overflow: hidden;
}

.store-heading ion-card-title {
  margin-top: 0.25rem;
}

.cart-item {
  align-items: flex-start;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--ion-border-color);
}

.cart-item > img,
.item-placeholder {
  width: 4.25rem;
  height: 4.25rem;
  flex: none;
  border-radius: 0.8rem;
  object-fit: cover;
}

.item-placeholder {
  display: grid;
  place-items: center;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 1.5rem;
}

.item-details {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.3rem;
}

.item-details > strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-details > span {
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  margin-left: -0.45rem;
}

.quantity-control ion-button {
  min-width: 2rem;
  min-height: 2rem;
  margin: 0;
  --padding-start: 0.35rem;
  --padding-end: 0.35rem;
}

.item-total {
  flex: none;
  font-size: 0.84rem;
}

.store-total {
  padding: 1rem 0;
}

.store-total > span {
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.empty-state {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: 1px dashed var(--ion-border-color);
  border-radius: var(--app-radius-card);
  text-align: center;
}

.empty-state > ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.5rem;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state p {
  color: var(--ion-color-medium);
}

@media (max-width: 380px) {
  .cart-item > img,
  .item-placeholder {
    width: 3.25rem;
    height: 3.25rem;
  }

  .item-total {
    font-size: 0.75rem;
  }
}
</style>
