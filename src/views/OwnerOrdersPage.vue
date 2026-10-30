<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Order management</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh orders" :disabled="loading" @click="loadOrders">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">STORE OPERATIONS</p>
      <div class="page-heading">
        <div>
          <h1>Orders</h1>
          <p>Review requests, coordinate delivery, and keep customers updated.</p>
        </div>
        <span class="order-total">{{ orders.length }} total</span>
      </div>

      <ion-searchbar
        v-model="searchText"
        class="order-search"
        placeholder="Search order, item, or customer"
        aria-label="Search orders"
        :debounce="150"
      />

      <ion-segment v-model="statusFilter" class="status-filter" scrollable>
        <ion-segment-button value="all">
          <ion-label>All</ion-label>
          <ion-badge>{{ orders.length }}</ion-badge>
        </ion-segment-button>
        <ion-segment-button value="pending">
          <ion-label>Pending</ion-label>
          <ion-badge v-if="countByStatus.pending">{{ countByStatus.pending }}</ion-badge>
        </ion-segment-button>
        <ion-segment-button value="confirmed">
          <ion-label>Confirmed</ion-label>
        </ion-segment-button>
        <ion-segment-button value="completed">
          <ion-label>Completed</ion-label>
        </ion-segment-button>
        <ion-segment-button value="cancelled">
          <ion-label>Cancelled</ion-label>
        </ion-segment-button>
      </ion-segment>

      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <section v-else-if="!orders.length" class="empty-state">
        <ion-icon :icon="receiptOutline" />
        <h2>No orders yet</h2>
        <p>Orders from customers will appear here. You can manage the full order lifecycle from this page.</p>
      </section>
      <section v-else-if="!filteredOrders.length" class="empty-state compact-empty">
        <ion-icon :icon="searchOutline" />
        <h2>No matching orders</h2>
        <p>Try a different search or order status.</p>
        <ion-button fill="clear" @click="clearFilters">Clear filters</ion-button>
      </section>
      <template v-else>
        <ion-card v-for="order in filteredOrders" :key="order.id" class="order-card">
          <ion-card-header>
            <div class="order-heading">
              <div>
                <ion-card-subtitle>ORDER #{{ order.id.slice(0, 8).toUpperCase() }}</ion-card-subtitle>
                <ion-card-title>{{ formatCurrency(order.total) }}</ion-card-title>
              </div>
              <ion-badge :color="statusColor(order.status)" class="status-badge">
                {{ order.status }}
              </ion-badge>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="order-meta">
              <ion-icon :icon="calendarOutline" />
              <span>{{ formatDate(order) }}</span>
              <span class="meta-divider">·</span>
              <span>Buyer {{ order.buyerId.slice(0, 8) }}</span>
            </div>

            <section class="order-items">
              <h2>Items ordered</h2>
              <div v-for="item in order.items" :key="item.productId" class="order-item">
                <div>
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.quantity }} × {{ formatCurrency(item.unitPrice) }}</span>
                </div>
                <strong>{{ formatCurrency(item.quantity * item.unitPrice) }}</strong>
              </div>
            </section>

            <section v-if="order.deliveryAddress" class="delivery-panel">
              <div class="delivery-heading">
                <ion-icon :icon="locationOutline" />
                <strong>Deliver to · {{ order.deliveryAddress.label }}</strong>
              </div>
              <strong>{{ order.deliveryAddress.recipientName }}</strong>
              <a :href="`tel:${order.deliveryAddress.phone}`">{{ order.deliveryAddress.phone }}</a>
              <p>{{ formatDeliveryAddress(order.deliveryAddress) }}</p>
              <p v-if="order.deliveryAddress.deliveryInstructions" class="delivery-instructions">
                Note: {{ order.deliveryAddress.deliveryInstructions }}
              </p>
            </section>
            <section v-else class="delivery-panel legacy-address">
              <div class="delivery-heading">
                <ion-icon :icon="locationOutline" />
                <strong>No saved delivery details</strong>
              </div>
              <p>Contact the customer to confirm the delivery address.</p>
            </section>

            <div v-if="nextStatuses(order.status).length" class="order-actions">
              <ion-button
                v-for="nextStatus in nextStatuses(order.status)"
                :key="nextStatus"
                :color="nextStatus === 'cancelled' ? 'danger' : 'primary'"
                :fill="nextStatus === 'cancelled' ? 'outline' : 'solid'"
                :disabled="updatingOrderIds.has(order.id)"
                @click="changeStatus(order, nextStatus)"
              >
                <ion-spinner
                  v-if="updatingOrderIds.has(order.id) && activeStatus === nextStatus"
                  slot="start"
                  name="crescent"
                />
                {{ statusActionLabel(nextStatus) }}
              </ion-button>
            </div>
            <p v-else class="finished-note">
              <ion-icon :icon="checkmarkCircleOutline" />
              This order is {{ order.status }}.
            </p>
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
  IonLabel,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  calendarOutline,
  checkmarkCircleOutline,
  locationOutline,
  receiptOutline,
  refreshOutline,
  searchOutline,
} from 'ionicons/icons';
import { formatDeliveryAddress } from '@/services/addressService';
import { listStoreOrders, updateStoreOrderStatus } from '@/services/orderService';
import { getOwnerStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus, PetFoodOrder } from '@/types';

type StatusFilter = OrderStatus | 'all';

const authStore = useAuthStore();
const orders = ref<PetFoodOrder[]>([]);
const loading = ref(true);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');
const searchText = ref('');
const statusFilter = ref<StatusFilter>('all');
const updatingOrderIds = ref(new Set<string>());
const activeStatus = ref<OrderStatus | null>(null);

const countByStatus = computed(() => ({
  pending: orders.value.filter((order) => order.status === 'pending').length,
}));

const filteredOrders = computed(() => {
  const search = searchText.value.trim().toLocaleLowerCase();
  return orders.value.filter((order) => {
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) return false;
    if (!search) return true;
    const searchableText = [
      order.id,
      order.buyerId,
      order.deliveryAddress?.recipientName ?? '',
      order.deliveryAddress?.phone ?? '',
      order.deliveryAddress ? formatDeliveryAddress(order.deliveryAddress) : '',
      ...order.items.map((item) => item.name),
    ].join(' ').toLocaleLowerCase();
    return searchableText.includes(search);
  });
});

function formatDate(order: PetFoodOrder): string {
  return order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Recently placed';
}

function statusColor(status: OrderStatus): string {
  if (status === 'confirmed') return 'success';
  if (status === 'completed') return 'primary';
  if (status === 'cancelled') return 'medium';
  return 'warning';
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

function statusActionLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Mark pending',
    confirmed: 'Confirm order',
    completed: 'Mark complete',
    cancelled: 'Cancel order',
  };
  return labels[status];
}

async function changeStatus(order: PetFoodOrder, status: OrderStatus): Promise<void> {
  if (status === 'cancelled' && !window.confirm(`Cancel order #${order.id.slice(0, 8).toUpperCase()}?`)) {
    return;
  }
  updatingOrderIds.value = new Set([...updatingOrderIds.value, order.id]);
  activeStatus.value = status;
  try {
    await updateStoreOrderStatus(order, status);
    order.status = status;
    messageColor.value = 'success';
    message.value = `Order ${status}.`;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not update this order.';
  } finally {
    const nextIds = new Set(updatingOrderIds.value);
    nextIds.delete(order.id);
    updatingOrderIds.value = nextIds;
    activeStatus.value = null;
  }
}

function clearFilters(): void {
  statusFilter.value = 'all';
  searchText.value = '';
}

async function loadOrders(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to manage your orders.');
    const store = await getOwnerStore(ownerId);
    if (!store) {
      orders.value = [];
      return;
    }
    orders.value = await listStoreOrders(store.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load your orders.';
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(loadOrders);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.045em;
}

.page-heading p {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
  line-height: 1.5;
}

.order-total {
  flex: none;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.order-search {
  --background: var(--ion-card-background);
  --border-radius: 0.8rem;
  --box-shadow: none;
  --placeholder-color: var(--ion-color-medium);
  padding: 0.75rem 0 0.5rem;
}

.status-filter {
  overflow: auto hidden;
  justify-content: flex-start;
  margin: 0.4rem 0 1rem;
  scrollbar-width: none;
}

.status-filter::-webkit-scrollbar {
  display: none;
}

.status-filter ion-segment-button {
  flex: 0 0 auto;
  min-width: 5.2rem;
  font-size: 0.75rem;
}

.status-filter ion-badge {
  margin-left: 0.25rem;
  font-size: 0.62rem;
}

.loading-state,
.empty-state {
  display: grid;
  min-height: 14rem;
  align-content: center;
  justify-items: center;
  text-align: center;
}

.empty-state ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.7rem;
}

.empty-state h2 {
  margin: 0.6rem 0 0.2rem;
  font-size: 1.1rem;
}

.empty-state p {
  max-width: 25rem;
  margin: 0.4rem 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
  line-height: 1.5;
}

.compact-empty {
  min-height: 11rem;
}

.order-card {
  margin: 0.8rem 0;
  border-radius: 1rem;
}

.order-card ion-card-header {
  padding-bottom: 0.65rem;
}

.order-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.order-heading ion-card-subtitle {
  margin-bottom: 0.3rem;
  font-size: 0.63rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.order-heading ion-card-title {
  font-size: 1.25rem;
  font-weight: 750;
}

.status-badge {
  flex: none;
  border-radius: 999px;
  padding: 0.4rem 0.55rem;
  text-transform: capitalize;
}

.order-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: var(--ion-color-medium);
  font-size: 0.72rem;
}

.order-meta ion-icon {
  font-size: 0.95rem;
}

.meta-divider {
  padding: 0 0.1rem;
}

.order-items {
  padding: 0.85rem 0;
  margin: 0.7rem 0;
  border-top: 1px solid var(--ion-border-color);
  border-bottom: 1px solid var(--ion-border-color);
}

.order-items h2 {
  margin: 0 0 0.55rem;
  font-size: 0.82rem;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.38rem 0;
  font-size: 0.8rem;
}

.order-item > div {
  display: grid;
  min-width: 0;
  gap: 0.16rem;
}

.order-item > div strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-item span {
  color: var(--ion-color-medium);
  font-size: 0.72rem;
}

.order-item > strong {
  flex: none;
}

.delivery-panel {
  display: grid;
  gap: 0.32rem;
  padding: 0.8rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.8rem;
  background: var(--app-surface-muted);
  font-size: 0.78rem;
  line-height: 1.45;
}

.delivery-heading {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ion-color-primary);
}

.delivery-heading ion-icon {
  flex: none;
}

.delivery-panel a {
  width: fit-content;
  color: var(--ion-color-primary);
}

.delivery-panel p {
  margin: 0;
  color: var(--ion-color-medium);
}

.delivery-panel .delivery-instructions {
  padding-top: 0.3rem;
  border-top: 1px solid var(--ion-border-color);
  color: var(--ion-text-color);
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  padding-top: 0.85rem;
}

.order-actions ion-button {
  margin: 0;
  --border-radius: 0.7rem;
}

.finished-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.85rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
  text-transform: capitalize;
}

.finished-note ion-icon {
  color: var(--ion-color-primary);
}
</style>
