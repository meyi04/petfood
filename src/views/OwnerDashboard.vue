<!-- src/views/OwnerDashboard.vue -->
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Business overview</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">STORE MANAGEMENT</p>
      <h1>Hello, {{ authStore.profile?.displayName }}</h1>
      <ion-spinner v-if="loading" />
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else>
        <ion-card v-if="!store">
          <ion-card-header><ion-card-title>Set up your store</ion-card-title></ion-card-header>
          <ion-card-content>
            <p>Create a store profile to list products and receive orders.</p>
            <ion-button router-link="/tabs/manage-store">Create store profile</ion-button>
          </ion-card-content>
        </ion-card>
        <template v-else>
            <section class="store-hero" :class="{ 'has-photo': store.imageUrl }">
              <img
                v-if="store.imageUrl"
                class="store-hero-image"
                :src="store.imageUrl"
                :alt="`${store.name} store background`"
              />
              <div v-else class="store-hero-icon"><ion-icon :icon="storefrontOutline" /></div>
              <p class="hero-eyebrow">YOUR STORE</p>
              <h2>{{ store.name }}</h2>
              <p class="store-location">
                <ion-icon :icon="locationOutline" />
                {{ store.address }}, {{ store.municipality }}
              </p>
              <div class="hero-actions">
                <ion-button router-link="/tabs/products" color="light">
                  <ion-icon slot="start" :icon="pricetagsOutline" />
                  Products
                </ion-button>
                <ion-button router-link="/tabs/manage-store" fill="outline" color="light">
                  Edit store
                </ion-button>
                <ion-button router-link="/tabs/reports" fill="clear" color="light">
                  <ion-icon slot="start" :icon="barChartOutline" />
                  Sales report
                </ion-button>
              </div>
            </section>
            <section class="overview-grid">
              <ion-card class="overview-card">
                <ion-card-content>
                  <span class="overview-icon pending-icon"><ion-icon :icon="timeOutline" /></span>
                  <strong>{{ pendingOrdersCount }}</strong>
                  <span>Pending orders</span>
                </ion-card-content>
              </ion-card>
              <ion-card class="overview-card">
                <ion-card-content>
                  <span class="overview-icon sales-icon"><ion-icon :icon="trendingUpOutline" /></span>
                  <strong>{{ formatCurrency(confirmedSales) }}</strong>
                  <span>Confirmed sales</span>
                </ion-card-content>
              </ion-card>
            </section>
            <div class="section-heading">
              <div>
                <p class="eyebrow">KEEP THINGS MOVING</p>
                <h2>Recent orders</h2>
              </div>
              <ion-button fill="clear" :disabled="loading" @click="refreshOrders">
                <ion-icon slot="icon-only" :icon="refreshOutline" />
              </ion-button>
            </div>
            <ion-text v-if="!orders.length"><p>No orders yet. New orders will appear here.</p></ion-text>
            <ion-card v-for="order in orders" :key="order.id" class="order-card">
              <ion-card-header>
                <div class="order-heading">
                  <div>
                    <ion-card-subtitle>ORDER #{{ order.id.slice(0, 8).toUpperCase() }}</ion-card-subtitle>
                    <ion-card-title>{{ formatCurrency(order.total) }}</ion-card-title>
                  </div>
                  <ion-badge :color="statusColor(order.status)">{{ order.status }}</ion-badge>
                </div>
              </ion-card-header>
              <ion-card-content>
                <p class="order-date">{{ formatDate(order.createdAt) }}</p>
                <ul class="order-items">
                  <li v-for="item in order.items" :key="item.productId">
                    {{ item.quantity }} × {{ item.name }}
                  </li>
                </ul>
                <div v-if="nextStatuses(order.status).length" class="status-controls">
                  <ion-select
                    label="Update status"
                    label-placement="stacked"
                    interface="popover"
                    placeholder="Choose status"
                    :disabled="updatingOrderIds.has(order.id)"
                    @ionChange="changeOrderStatus(order, $event.detail.value)"
                  >
                    <ion-select-option
                      v-for="status in nextStatuses(order.status)"
                      :key="status"
                      :value="status"
                    >
                      {{ statusLabel(status) }}
                    </ion-select-option>
                  </ion-select>
                  <ion-spinner v-if="updatingOrderIds.has(order.id)" />
                </div>
                <p v-else class="finished-note">This order is {{ order.status }}.</p>
              </ion-card-content>
            </ion-card>
        </template>
      </template>
      <ion-toast
        :is-open="Boolean(message)"
        :message="message"
        duration="3500"
        color="danger"
        @did-dismiss="message = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  IonBadge,
  IonButton,
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
} from '@ionic/vue';
import {
  barChartOutline,
  locationOutline,
  pricetagsOutline,
  refreshOutline,
  storefrontOutline,
  timeOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { listStoreOrders, updateStoreOrderStatus } from '@/services/orderService';
import { getOwnerStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus, PetFoodOrder, Store } from '@/types';

const authStore = useAuthStore();
const store = ref<Store | null>(null);
const orders = ref<PetFoodOrder[]>([]);
const loading = ref(true);
const error = ref('');
const message = ref('');
const updatingOrderIds = ref(new Set<string>());
const ownerStoreId = ref('');

const pendingOrdersCount = computed(() =>
  orders.value.filter((order) => order.status === 'pending').length,
);

const confirmedSales = computed(() =>
  orders.value
    .filter((order) => order.status === 'confirmed' || order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0),
);

function formatDate(value: PetFoodOrder['createdAt']): string {
  return value?.toDate ? value.toDate().toLocaleString() : 'Just now';
}

function nextStatuses(status: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[status];
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

async function changeOrderStatus(order: PetFoodOrder, status: OrderStatus | undefined): Promise<void> {
  if (!status || !ownerStoreId.value) return;
  updatingOrderIds.value = new Set([...updatingOrderIds.value, order.id]);
  try {
    await updateStoreOrderStatus(order, status);
    order.status = status;
    message.value = `Order updated to ${status}.`;
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : 'Could not update this order.';
  } finally {
    const nextIds = new Set(updatingOrderIds.value);
    nextIds.delete(order.id);
    updatingOrderIds.value = nextIds;
  }
}

async function refreshOrders(): Promise<void> {
  if (!ownerStoreId.value) return;
  try {
    orders.value = await listStoreOrders(ownerStoreId.value);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not refresh orders.';
  }
}

onMounted(async () => {
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to load your dashboard.');
    store.value = await getOwnerStore(ownerId);
    if (store.value) {
      ownerStoreId.value = store.value.id;
      orders.value = await listStoreOrders(store.value.id);
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load the owner dashboard.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.4rem;
  color: var(--ion-color-primary);
  font-size: 0.66rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.store-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 1.35rem;
  margin: 1rem 0;
  border-radius: 1.2rem;
  background: linear-gradient(120deg, #174f45, #257c66 68%, #46977d);
  color: white;
  box-shadow: 0 14px 28px rgb(23 79 69 / 16%);
}

.store-hero.has-photo {
  background: #174f45;
}

.store-hero-image,
.store-hero::before {
  position: absolute;
  z-index: -1;
  inset: 0;
}

.store-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-hero.has-photo::before {
  background: linear-gradient(90deg, rgb(16 53 45 / 91%), rgb(20 68 56 / 72%) 65%, rgb(20 68 56 / 43%));
  content: "";
}

.store-hero-icon {
  display: grid;
  width: 2.7rem;
  height: 2.7rem;
  place-items: center;
  margin-bottom: 1rem;
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 0.85rem;
  background: rgb(255 255 255 / 12%);
  font-size: 1.35rem;
}

.hero-eyebrow {
  margin: 0;
  color: #c2e4d5;
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.09em;
}

.store-hero h2 {
  position: relative;
  z-index: 1;
  margin: 0.35rem 0;
  color: white;
  font-size: 1.5rem;
  letter-spacing: -0.04em;
}

.store-location {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0;
  color: #e1f0e9;
  font-size: 0.82rem;
  line-height: 1.45;
}

.store-location ion-icon {
  flex: none;
  margin-top: 0.1rem;
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.hero-actions ion-button {
  margin: 0;
  --border-radius: 0.75rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 1rem 0 1.5rem;
}

.overview-card {
  margin: 0;
  border-radius: 1rem;
}

.overview-card ion-card-content {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
}

.overview-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.7rem;
  font-size: 1.05rem;
}

.pending-icon {
  background: #fff4e1;
  color: #b8791d;
}

.sales-icon {
  background: #e8f3ee;
  color: var(--ion-color-primary);
}

.overview-card strong {
  overflow-wrap: anywhere;
  font-size: clamp(1.15rem, 5vw, 1.5rem);
  letter-spacing: -0.04em;
}

.overview-card > ion-card-content > span:last-child {
  color: var(--ion-color-medium);
  font-size: 0.76rem;
}

h1 {
  margin-top: 0;
  font-size: 1.8rem;
  letter-spacing: -0.04em;
}

.section-heading,
.order-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading {
  margin-top: 1.6rem;
}

.section-heading h2 {
  margin: 0;
}

.section-heading .eyebrow {
  margin-bottom: 0.25rem;
}

.order-heading ion-card-subtitle {
  margin-bottom: 0.35rem;
  font-size: 0.65rem;
  letter-spacing: 0.06em;
}

.order-heading ion-card-title {
  font-size: 1.25rem;
  font-weight: 750;
}

.order-heading ion-badge {
  border-radius: 999px;
  padding: 0.4rem 0.55rem;
  text-transform: capitalize;
}

.order-date,
.finished-note {
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.order-items {
  display: grid;
  gap: 0.35rem;
  padding: 0.5rem 0 0.75rem 1.25rem;
  margin-bottom: 0.5rem;
}

.status-controls {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--ion-color-light);
}

.status-controls ion-select {
  flex: 1;
}

.status-controls ion-spinner {
  margin-bottom: 0.8rem;
}
</style>
