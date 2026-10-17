<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>My orders</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh orders" :disabled="loading" @click="loadOrders">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">YOUR PURCHASES</p>
      <h1>Order tracking</h1>
      <p class="intro">Check each order's latest status from the store.</p>
      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <section v-else-if="!orders.length" class="empty-state">
        <ion-icon :icon="receiptOutline" />
        <h2>No orders yet</h2>
        <p>Your orders will appear here after you order a product from a store.</p>
        <ion-button router-link="/tabs/stores">Find a store</ion-button>
      </section>
      <template v-else>
        <ion-card v-for="order in orders" :key="order.id" class="order-card">
          <ion-card-header>
            <div class="order-heading">
              <div class="store-name">
                <span class="store-icon"><ion-icon :icon="storefrontOutline" /></span>
                <div>
                  <ion-card-subtitle>ORDER #{{ order.id.slice(0, 7).toUpperCase() }}</ion-card-subtitle>
                <ion-card-title>{{ storeNames[order.storeId] || 'Pet food store' }}</ion-card-title>
                </div>
              </div>
              <ion-badge class="status-badge" :color="statusColor(order.status)">
                {{ statusLabel(order.status) }}
              </ion-badge>
            </div>
          </ion-card-header>
          <ion-card-content>
            <p class="order-date">{{ formatDate(order.createdAt) }}</p>
            <ul class="items">
              <li v-for="item in order.items" :key="item.productId">
                <span>{{ item.name }}</span>
                <span class="item-quantity">× {{ item.quantity }}</span>
              </li>
            </ul>
            <div class="order-footer">
              <div>
                <span class="total-label">ORDER TOTAL</span>
                <strong>{{ formatCurrency(order.total) }}</strong>
              </div>
              <ion-button fill="clear" size="small" @click="openStore(order.storeId)">
                Store details
                <ion-icon slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
            <div class="status-note">
              <ion-icon :icon="informationCircleOutline" />
              <p>{{ statusMessage(order.status) }}</p>
            </div>
          </ion-card-content>
        </ion-card>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonBadge,
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  arrowForwardOutline,
  informationCircleOutline,
  receiptOutline,
  refreshOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { listBuyerOrders } from '@/services/orderService';
import { getStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus, PetFoodOrder } from '@/types';

const authStore = useAuthStore();
const router = useRouter();
const orders = ref<PetFoodOrder[]>([]);
const storeNames = ref<Record<string, string>>({});
const loading = ref(true);
const error = ref('');

function formatDate(orderDate: PetFoodOrder['createdAt']): string {
  return orderDate?.toDate ? orderDate.toDate().toLocaleString() : 'Recently placed';
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: OrderStatus): string {
  if (status === 'confirmed') return 'success';
  if (status === 'completed') return 'primary';
  if (status === 'cancelled') return 'medium';
  return 'warning';
}

function statusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    pending: 'Waiting for the store to confirm your order.',
    confirmed: 'The store has confirmed your order.',
    completed: 'This order has been completed.',
    cancelled: 'This order was cancelled by the store.',
  };
  return messages[status];
}

function openStore(storeId: string): void {
  void router.push(`/stores/${storeId}`);
}

async function loadOrders(): Promise<void> {
  if (!authStore.profile) {
    error.value = 'Sign in again to view your orders.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    orders.value = await listBuyerOrders(authStore.profile.uid);
    const storeIds = [...new Set(orders.value.map((order) => order.storeId))];
    const stores = await Promise.all(storeIds.map((id) => getStore(id)));
    storeNames.value = Object.fromEntries(
      stores.filter((store) => store !== null).map((store) => [store.id, store.name]),
    );
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load your orders.';
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrders);
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

.loading-state {
  display: grid;
  min-height: 13rem;
  place-items: center;
}

.order-heading,
.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.store-name {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.store-name > div {
  min-width: 0;
}

.store-name ion-card-subtitle {
  margin-bottom: 0.3rem;
  color: var(--ion-color-medium);
  font-size: 0.64rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.store-name ion-card-title {
  font-size: 1rem;
  font-weight: 700;
}

.store-icon {
  display: grid;
  flex: none;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  border-radius: 0.85rem;
  background: #e8f3ee;
  color: var(--ion-color-primary);
  font-size: 1.25rem;
}

.status-badge {
  flex: none;
  border-radius: 999px;
  padding: 0.4rem 0.55rem;
  font-size: 0.68rem;
  text-transform: capitalize;
}

.order-date {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.items {
  display: grid;
  gap: 0.55rem;
  padding: 0.85rem 0;
  margin: 0;
  border-bottom: 1px solid var(--ion-color-light);
  list-style: none;
}

.items li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  line-height: 1.4;
}

.item-quantity,
.total-label {
  color: var(--ion-color-medium);
}

.order-footer {
  padding-top: 0.85rem;
}

.order-footer > div {
  display: grid;
  gap: 0.25rem;
}

.total-label {
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.order-footer strong {
  font-size: 1.1rem;
}

.status-note {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  margin-top: 0.65rem;
  border-radius: 0.65rem;
  background: #f3f6f4;
  color: #65736d;
  font-size: 0.8rem;
}

.status-note ion-icon {
  flex: none;
  margin-top: 0.1rem;
  color: var(--ion-color-primary);
}

.status-note p {
  margin: 0;
  line-height: 1.4;
}

.empty-state {
  display: grid;
  justify-items: center;
  padding: 3.5rem 1rem;
  text-align: center;
}

.empty-state ion-icon {
  color: var(--ion-color-primary);
  font-size: 3.2rem;
}

.empty-state h2 {
  margin-bottom: 0.2rem;
}

.empty-state p {
  max-width: 20rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
}
</style>
