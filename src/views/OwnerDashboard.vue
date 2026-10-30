<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Business overview</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh dashboard" :disabled="loading" @click="loadDashboard">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else-if="store">
        <p class="eyebrow">STORE MANAGEMENT</p>
        <div class="page-heading">
          <div>
            <h1>Welcome back, {{ authStore.profile?.displayName }}</h1>
            <p>Here’s how {{ store.name }} is doing today.</p>
          </div>
          <ion-button fill="clear" router-link="/tabs/manage-store" aria-label="Edit store profile">
            <ion-icon slot="icon-only" :icon="settingsOutline" />
          </ion-button>
        </div>

        <section class="store-hero" :class="{ 'has-photo': store.imageUrl }">
          <img
            v-if="store.imageUrl"
            class="store-hero-image"
            :src="store.imageUrl"
            :alt="`${store.name} store`"
          />
          <div v-else class="store-hero-icon"><ion-icon :icon="storefrontOutline" /></div>
          <div class="store-hero-copy">
            <p class="hero-eyebrow">YOUR STORE</p>
            <h2>{{ store.name }}</h2>
            <p class="store-location">
              <ion-icon :icon="locationOutline" />
              {{ store.address }}, {{ store.municipality }}
            </p>
          </div>
          <div class="hero-actions">
            <ion-button router-link="/tabs/products" color="light">
              <ion-icon slot="start" :icon="pricetagsOutline" />
              Manage products
            </ion-button>
            <ion-button router-link="/tabs/owner-orders" fill="outline" color="light">
              <ion-icon slot="start" :icon="receiptOutline" />
              View orders
            </ion-button>
          </div>
        </section>

        <section class="metric-grid" aria-label="Business summary">
          <ion-card class="metric-card pending-card">
            <ion-card-content>
              <span class="metric-icon"><ion-icon :icon="timeOutline" /></span>
              <span class="metric-label">NEEDS ATTENTION</span>
              <strong>{{ pendingOrdersCount }}</strong>
              <span class="metric-footnote">Pending orders</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-icon"><ion-icon :icon="receiptOutline" /></span>
              <span class="metric-label">ALL TIME</span>
              <strong>{{ orders.length }}</strong>
              <span class="metric-footnote">Total orders received</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card revenue-card">
            <ion-card-content>
              <span class="metric-icon"><ion-icon :icon="trendingUpOutline" /></span>
              <span class="metric-label">LAST 7 DAYS</span>
              <strong>{{ formatCurrency(lastSevenDaySales) }}</strong>
              <span class="metric-footnote">Confirmed sales</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-icon"><ion-icon :icon="pricetagsOutline" /></span>
              <span class="metric-label">CATALOG</span>
              <strong>{{ productCount }}</strong>
              <span class="metric-footnote">Products listed</span>
            </ion-card-content>
          </ion-card>
        </section>

        <section class="analytics-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">SALES ANALYTICS</p>
              <h2>Last 7 days</h2>
            </div>
            <ion-button fill="clear" size="small" router-link="/tabs/reports">
              Full report
              <ion-icon slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </div>
          <p class="chart-summary">Confirmed sales by day · {{ formatCurrency(lastSevenDaySales) }} total</p>
          <div
            class="sales-chart"
            role="img"
            :aria-label="`Sales over the last seven days. Total ${formatCurrency(lastSevenDaySales)}.`"
          >
            <div v-for="day in salesByDay" :key="day.key" class="chart-column">
              <span class="chart-value">{{ day.amount > 0 ? formatCurrency(day.amount) : '' }}</span>
              <div class="chart-track">
                <div
                  class="chart-bar"
                  :class="{ 'has-sales': day.amount > 0 }"
                  :style="{ height: `${day.height}%` }"
                />
              </div>
              <span class="chart-label">{{ day.label }}</span>
            </div>
          </div>
          <p v-if="!lastSevenDaySales" class="chart-empty">
            Confirmed orders will appear here as your sales come in.
          </p>
        </section>

        <section class="order-summary">
          <div>
            <p class="eyebrow">ORDER MANAGEMENT</p>
            <h2>Keep every order moving</h2>
            <p>Review new requests, contact customers, and update fulfillment status in one place.</p>
          </div>
          <ion-button router-link="/tabs/owner-orders">
            Manage orders
            <ion-icon slot="end" :icon="arrowForwardOutline" />
          </ion-button>
        </section>
      </template>
      <template v-else>
        <p class="eyebrow">GET STARTED</p>
        <h1>Set up your store</h1>
        <ion-card class="setup-card">
          <ion-card-content>
            <span class="setup-icon"><ion-icon :icon="storefrontOutline" /></span>
            <h2>Bring your shop online</h2>
            <p>Create a store profile to list products, reach local pet owners, and manage incoming orders.</p>
            <ion-button router-link="/tabs/manage-store">
              Create store profile
              <ion-icon slot="end" :icon="arrowForwardOutline" />
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
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import {
  arrowForwardOutline,
  locationOutline,
  pricetagsOutline,
  receiptOutline,
  refreshOutline,
  settingsOutline,
  storefrontOutline,
  timeOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { listStoreOrders } from '@/services/orderService';
import { getOwnerStore, listProducts } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { PetFoodOrder, Store } from '@/types';

interface DailySales {
  key: string;
  label: string;
  amount: number;
  height: number;
}

const authStore = useAuthStore();
const store = ref<Store | null>(null);
const orders = ref<PetFoodOrder[]>([]);
const productCount = ref(0);
const loading = ref(true);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('danger');

const pendingOrdersCount = computed(() =>
  orders.value.filter((order) => order.status === 'pending').length,
);

const salesByDay = computed<DailySales[]>(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailyTotals = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const amount = orders.value
      .filter((order) => order.status === 'confirmed' || order.status === 'completed')
      .filter((order) => {
        const saleDate = (order.confirmedAt ?? order.completedAt ?? order.createdAt)?.toDate?.();
        return saleDate !== undefined && saleDate >= date && saleDate < nextDate;
      })
      .reduce((sum, order) => sum + order.total, 0);
    return {
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      amount,
    };
  });
  const maxAmount = Math.max(...dailyTotals.map((day) => day.amount));
  return dailyTotals.map((day) => ({
    ...day,
    height: maxAmount > 0 ? Math.max((day.amount / maxAmount) * 100, 4) : 0,
  }));
});

const lastSevenDaySales = computed(() =>
  salesByDay.value.reduce((sum, day) => sum + day.amount, 0),
);

async function loadDashboard(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to load your dashboard.');
    store.value = await getOwnerStore(ownerId);
    if (!store.value) {
      orders.value = [];
      productCount.value = 0;
      return;
    }
    const [storeOrders, products] = await Promise.all([
      listStoreOrders(store.value.id),
      listProducts(store.value.id),
    ]);
    orders.value = storeOrders;
    productCount.value = products.length;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load the owner dashboard.';
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(loadDashboard);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.page-heading,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.page-heading {
  margin-bottom: 1rem;
}

h1 {
  margin: 0;
  font-size: clamp(1.45rem, 6vw, 1.9rem);
  letter-spacing: -0.045em;
}

.page-heading p,
.order-summary p:not(.eyebrow) {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  line-height: 1.5;
}

.store-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  min-height: 12rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1.25rem;
  border-radius: 1.15rem;
  background: linear-gradient(120deg, #713723, #a94a2e 68%, #ce7953);
  color: white;
  box-shadow: 0 14px 28px rgb(23 79 69 / 14%);
}

.store-hero.has-photo {
  background: #713723;
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
  background: linear-gradient(90deg, rgb(47 24 16 / 90%), rgb(71 34 21 / 67%) 70%, rgb(71 34 21 / 38%));
  content: "";
}

.store-hero-copy {
  position: relative;
  z-index: 1;
}

.store-hero-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  margin-bottom: 0.75rem;
  border-radius: 0.8rem;
  background: rgb(255 255 255 / 14%);
  font-size: 1.25rem;
}

.hero-eyebrow {
  margin: 0;
  color: #f6d6c3;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.09em;
}

.store-hero h2 {
  margin: 0.25rem 0 0.4rem;
  color: white;
  font-size: 1.4rem;
}

.store-location {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  margin: 0;
  color: #fff0e7;
  font-size: 0.8rem;
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
  gap: 0.45rem;
  margin-top: 0.9rem;
}

.hero-actions ion-button {
  margin: 0;
  --border-radius: 0.75rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 1rem 0;
}

.metric-card {
  min-width: 0;
  margin: 0;
  border-radius: 0.95rem;
}

.metric-card ion-card-content {
  display: grid;
  min-height: 8.7rem;
  align-content: space-between;
  justify-items: start;
  gap: 0.42rem;
  padding: 0.9rem;
}

.metric-icon,
.setup-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 1rem;
}

.pending-card .metric-icon {
  background: #fbf0d7;
  color: #a76b12;
}

.metric-label {
  color: var(--ion-color-medium);
  font-size: 0.57rem;
  font-weight: 750;
  letter-spacing: 0.06em;
}

.metric-card strong {
  overflow-wrap: anywhere;
  font-size: clamp(1.1rem, 5vw, 1.5rem);
  letter-spacing: -0.04em;
}

.metric-footnote {
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.revenue-card {
  border: 0;
  background: linear-gradient(135deg, #713723, #b95030);
  color: white;
}

.revenue-card .metric-icon {
  background: rgb(255 255 255 / 15%);
  color: white;
}

.revenue-card .metric-label,
.revenue-card .metric-footnote {
  color: #f6d6c3;
}

.analytics-card {
  padding: 1rem;
  margin-top: 1.25rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
}

.section-heading h2,
.order-summary h2 {
  margin: 0;
  font-size: 1.1rem;
  letter-spacing: -0.025em;
}

.section-heading .eyebrow {
  margin-bottom: 0.2rem;
}

.section-heading ion-button {
  flex: none;
  margin: 0;
}

.chart-summary {
  margin: 0.7rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.sales-chart {
  display: grid;
  height: 12.5rem;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
  padding-top: 0.9rem;
}

.chart-column {
  display: grid;
  min-width: 0;
  grid-template-rows: 1.1rem 1fr 1.1rem;
  gap: 0.35rem;
  text-align: center;
}

.chart-value,
.chart-label {
  overflow: hidden;
  color: var(--ion-color-medium);
  font-size: 0.62rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-track {
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 0.55rem 0.55rem 0 0;
  background: var(--app-surface-muted);
}

.chart-bar {
  width: 100%;
  min-height: 0.2rem;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--ion-color-primary);
  transition: height 180ms ease;
}

.chart-bar.has-sales {
  background: linear-gradient(180deg, #2b9c84, #197b68);
}

.chart-empty {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.order-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  margin: 1rem 0 0.5rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--app-surface-muted);
}

.order-summary ion-button {
  flex: none;
  margin: 0;
}

.setup-card {
  margin: 1rem 0;
}

.setup-card ion-card-content {
  display: grid;
  justify-items: start;
  gap: 0.55rem;
  padding: 1.2rem;
}

.setup-icon {
  width: 2.8rem;
  height: 2.8rem;
  font-size: 1.35rem;
}

.setup-card h2 {
  margin: 0;
}

.setup-card p {
  margin: 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.loading-state {
  display: grid;
  min-height: 50vh;
  place-items: center;
}

@media (min-width: 760px) {
  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .store-hero {
    min-height: 14rem;
    padding: 1.6rem;
  }

  .analytics-card {
    padding: 1.35rem;
  }
}

@media (max-width: 380px) {
  .order-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .chart-value {
    font-size: 0.53rem;
  }
}
</style>
