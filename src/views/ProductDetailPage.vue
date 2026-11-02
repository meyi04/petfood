<!-- src/views/ProductDetailPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/home" /></ion-buttons>
        <ion-title>Product details</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-spinner v-if="loading" />
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else-if="product">
        <img v-if="product.imageUrl" class="product-image" :src="product.imageUrl" :alt="product.name" />
        <h1>{{ product.name }}</h1>
        <ion-chip>{{ product.category }}</ion-chip>
        <p>{{ product.description }}</p>
        <section class="delivery-panel">
          <div class="delivery-heading">
            <div>
              <span class="detail-label">DELIVER TO</span>
              <strong>Delivery address</strong>
            </div>
            <ion-button fill="clear" size="small" @click="manageAddresses">
              {{ deliveryAddresses.length ? 'Manage' : 'Add address' }}
            </ion-button>
          </div>
          <ion-spinner v-if="addressesLoading" name="crescent" />
          <ion-text v-else-if="addressError" color="danger">
            <p class="address-error">{{ addressError }}</p>
          </ion-text>
          <template v-else-if="deliveryAddresses.length">
            <ion-select
              v-model="selectedAddressId"
              aria-label="Select delivery address"
              interface="popover"
            >
              <ion-select-option
                v-for="address in deliveryAddresses"
                :key="address.id"
                :value="address.id"
              >
                {{ address.label }}{{ address.isDefault ? ' · Default' : '' }}
              </ion-select-option>
            </ion-select>
            <div v-if="selectedAddress" class="selected-address">
              <strong>{{ selectedAddress.recipientName }} · {{ selectedAddress.phone }}</strong>
              <p>{{ formatDeliveryAddress(selectedAddress) }}</p>
            </div>
          </template>
          <div v-else class="no-address">
            <ion-icon :icon="locationOutline" />
            <p>Add a delivery address before placing your order.</p>
            <ion-button fill="outline" size="small" @click="manageAddresses">
              Add delivery address
            </ion-button>
          </div>
        </section>
        <section class="purchase-panel">
          <div class="price-row">
            <div>
              <span class="detail-label">PRICE PER ITEM</span>
              <strong class="unit-price">{{ formatCurrency(product.price) }}</strong>
            </div>
            <div class="quantity-control" aria-label="Choose order quantity">
              <ion-button
                fill="outline"
                aria-label="Decrease quantity"
                :disabled="quantity <= 1 || ordering"
                @click="quantity = Math.max(1, quantity - 1)"
              >
                <ion-icon slot="icon-only" :icon="removeOutline" />
              </ion-button>
              <ion-input
                v-model.number="quantity"
                aria-label="Order quantity"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                :disabled="ordering"
                @ion-blur="normalizeQuantity"
              />
              <ion-button
                fill="outline"
                aria-label="Increase quantity"
                :disabled="ordering"
                @click="quantity += 1"
              >
                <ion-icon slot="icon-only" :icon="addOutline" />
              </ion-button>
            </div>
          </div>
          <div class="total-row">
            <span>Order total</span>
            <strong>{{ formatCurrency(orderTotal) }}</strong>
          </div>
        </section>
        <ion-button
          expand="block"
          fill="outline"
          :disabled="!isValidQuantity || !product"
          @click="addToCart"
        >
          <ion-icon slot="start" :icon="cartOutline" />
          Add to cart
        </ion-button>
        <ion-button
          expand="block"
          :disabled="ordering || !isValidQuantity || !selectedAddress || addressesLoading || Boolean(addressError)"
          @click="order"
        >
          {{ ordering ? 'Placing order…' : 'Order now' }}
        </ion-button>
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  IonButton,
  onIonViewWillEnter,
} from '@ionic/vue';
import { addOutline, cartOutline, locationOutline, removeOutline } from 'ionicons/icons';
import {
  formatDeliveryAddress,
  listDeliveryAddresses,
} from '@/services/addressService';
import { getProduct, getStore } from '@/services/storeService';
import { placeOrder } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { formatCurrency } from '@/utils/format';
import type { DeliveryAddress, Product } from '@/types';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const cart = useCartStore();
const product = ref<Product | null>(null);
const deliveryAddresses = ref<DeliveryAddress[]>([]);
const selectedAddressId = ref('');
const addressesLoading = ref(true);
const addressError = ref('');
const quantity = ref(1);
const loading = ref(true);
const ordering = ref(false);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');
const isValidQuantity = computed(() =>
  Number.isSafeInteger(quantity.value) && quantity.value > 0,
);
const orderTotal = computed(() =>
  product.value && isValidQuantity.value
    ? product.value.price * quantity.value
    : 0,
);
const selectedAddress = computed(() =>
  deliveryAddresses.value.find((address) => address.id === selectedAddressId.value) ?? null,
);

function manageAddresses(): void {
  void router.push('/tabs/account');
}

async function loadDeliveryAddresses(): Promise<void> {
  const userId = authStore.profile?.uid;
  if (!userId) {
    addressError.value = 'Sign in again to load your delivery addresses.';
    addressesLoading.value = false;
    return;
  }
  addressesLoading.value = true;
  addressError.value = '';
  try {
    deliveryAddresses.value = await listDeliveryAddresses(userId);
    if (!deliveryAddresses.value.some((address) => address.id === selectedAddressId.value)) {
      selectedAddressId.value =
        deliveryAddresses.value.find((address) => address.isDefault)?.id ??
        deliveryAddresses.value[0]?.id ??
        '';
    }
  } catch (cause) {
    addressError.value = cause instanceof Error
      ? cause.message
      : 'Could not load your delivery addresses.';
  } finally {
    addressesLoading.value = false;
  }
}

function normalizeQuantity(): void {
  if (!Number.isSafeInteger(quantity.value) || quantity.value < 1) {
    quantity.value = 1;
  }
}

function addToCart(): void {
  if (!product.value || !authStore.profile || !isValidQuantity.value) {
    messageColor.value = 'danger';
    message.value = 'Enter a whole-number quantity greater than zero.';
    normalizeQuantity();
    return;
  }
  try {
    cart.loadForBuyer(authStore.profile.uid);
    cart.addItem({
      productId: product.value.id,
      storeId: product.value.storeId,
      name: product.value.name,
      unitPrice: product.value.price,
      imageUrl: product.value.imageUrl,
      quantity: quantity.value,
    });
    messageColor.value = 'success';
    message.value = `${product.value.name} added to your cart.`;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not add this product to your cart.';
  }
}

async function order(): Promise<void> {
  if (!product.value || !authStore.profile || !selectedAddress.value) return;
  if (!isValidQuantity.value) {
    messageColor.value = 'danger';
    message.value = 'Enter a whole-number quantity greater than zero.';
    normalizeQuantity();
    return;
  }
  ordering.value = true;
  try {
    const store = await getStore(product.value.storeId);
    if (!store) throw new Error('This store is no longer available.');
    await placeOrder(authStore.profile.uid, store.id, [{
      productId: product.value.id,
      name: product.value.name,
      quantity: quantity.value,
      unitPrice: product.value.price,
    }], {
      label: selectedAddress.value.label,
      recipientName: selectedAddress.value.recipientName,
      phone: selectedAddress.value.phone,
      streetAddress: selectedAddress.value.streetAddress,
      barangay: selectedAddress.value.barangay,
      municipality: selectedAddress.value.municipality,
      province: selectedAddress.value.province,
      postalCode: selectedAddress.value.postalCode,
      deliveryInstructions: selectedAddress.value.deliveryInstructions,
    });
    messageColor.value = 'success';
    message.value = 'Your order was sent to the store.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not place your order.';
  } finally {
    ordering.value = false;
  }
}

onMounted(async () => {
  try {
    product.value = await getProduct(String(route.params.productId));
    if (!product.value) error.value = 'This product could not be found.';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this product.';
  } finally {
    loading.value = false;
  }
});

onIonViewWillEnter(loadDeliveryAddresses);
</script>

<style scoped>
.delivery-panel {
  padding: 1rem;
  margin: 1.25rem 0;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
  box-shadow: var(--app-shadow-soft);
}

.delivery-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.delivery-heading > div {
  display: grid;
  gap: 0.15rem;
}

.delivery-heading strong {
  font-size: 1rem;
}

.delivery-heading ion-button {
  flex: none;
  margin: 0;
}

.selected-address {
  padding: 0.75rem;
  margin-top: 0.65rem;
  border-radius: 0.75rem;
  background: var(--app-surface-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

.selected-address p {
  margin: 0.25rem 0 0;
  color: var(--ion-color-medium);
}

.no-address {
  display: grid;
  justify-items: start;
  gap: 0.5rem;
  padding-top: 0.3rem;
}

.no-address > ion-icon {
  color: var(--ion-color-primary);
  font-size: 1.5rem;
}

.no-address p,
.address-error {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.no-address ion-button {
  margin: 0;
}

.purchase-panel {
  padding: 1rem;
  margin: 1.25rem 0;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.05);
}

.price-row,
.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.detail-label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--ion-color-medium);
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.unit-price {
  font-size: 1.2rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.quantity-control ion-button {
  width: 2.5rem;
  height: 2.5rem;
  margin: 0;
  --padding-start: 0;
  --padding-end: 0;
}

.quantity-control ion-input {
  width: 3rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  --padding-start: 0.2rem;
  --padding-end: 0.2rem;
}

.total-row {
  padding-top: 0.85rem;
  margin-top: 0.85rem;
  border-top: 1px solid var(--ion-color-light);
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.total-row strong {
  color: var(--ion-text-color);
  font-size: 1.1rem;
}

.product-image {
  display: block;
  width: 100%;
  max-height: 22rem;
  object-fit: cover;
  border-radius: 0.75rem;
}
</style>
