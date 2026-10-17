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
        <ion-button expand="block" :disabled="ordering || !isValidQuantity" @click="order">
          {{ ordering ? 'Placing order…' : 'Place order' }}
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonBackButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonInput,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  IonButton,
} from '@ionic/vue';
import { addOutline, removeOutline } from 'ionicons/icons';
import { computed } from 'vue';
import { getProduct, getStore } from '@/services/storeService';
import { placeOrder } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';

const route = useRoute();
const authStore = useAuthStore();
const product = ref<Product | null>(null);
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

function normalizeQuantity(): void {
  if (!Number.isSafeInteger(quantity.value) || quantity.value < 1) {
    quantity.value = 1;
  }
}

async function order(): Promise<void> {
  if (!product.value || !authStore.profile) return;
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
    }]);
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
    if (!product.value) throw new Error('This product could not be found.');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this product.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.purchase-panel {
  padding: 1rem;
  margin: 1.25rem 0;
  border: 1px solid rgb(35 51 45 / 6%);
  border-radius: 1rem;
  background: white;
  box-shadow: 0 8px 24px rgb(35 51 45 / 5%);
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
