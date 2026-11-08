<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Sales reports</ion-title>
        <ion-buttons slot="end">
          <ion-button :disabled="loading || !salesOrders.length" @click="downloadReport">
            <ion-icon slot="start" :icon="downloadOutline" />
            Export
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">UNDERSTAND YOUR BUSINESS</p>
      <div class="report-heading">
        <div>
          <h1>Sales report</h1>
          <p v-if="store">{{ store.name }} · {{ store.address }}, {{ store.municipality }}</p>
          <p v-else>Confirmed orders count toward sales. Cancelled orders are excluded.</p>
        </div>
        <ion-select v-model="period" aria-label="Report date range" interface="popover">
          <ion-select-option value="7">Last 7 days</ion-select-option>
          <ion-select-option value="30">Last 30 days</ion-select-option>
          <ion-select-option value="all">All time</ion-select-option>
        </ion-select>
      </div>

      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else>
        <section v-if="store" class="shop-identity">
          <img v-if="store.imageUrl" :src="store.imageUrl" :alt="`${store.name} shop`" />
          <div class="shop-copy">
            <span>REPORT FOR</span>
            <strong>{{ store.name }}</strong>
            <small>{{ store.address }}, {{ store.municipality }} · {{ store.phone }}</small>
          </div>
        </section>

        <section class="metric-grid">
          <ion-card class="metric-card revenue-card">
            <ion-card-content>
              <span class="metric-label">TOTAL SALES</span>
              <strong>{{ formatCurrency(totalSales) }}</strong>
              <span class="metric-footnote">{{ periodLabel }}</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">CONFIRMED ORDERS</span>
              <strong>{{ salesOrders.length }}</strong>
              <span class="metric-footnote">{{ periodLabel }}</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">ITEMS SOLD</span>
              <strong>{{ itemsSold }}</strong>
              <span class="metric-footnote">Across confirmed orders</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">AVERAGE ORDER</span>
              <strong>{{ formatCurrency(averageOrder) }}</strong>
              <span class="metric-footnote">Per completed order</span>
            </ion-card-content>
          </ion-card>
        </section>

        <section class="products-section">
          <div class="section-heading">
            <div>
              <p class="eyebrow">BEST SELLERS</p>
              <h2>Products sold</h2>
            </div>
            <span>{{ topProducts.length }} products</span>
          </div>
          <ion-card v-if="topProducts.length" class="products-card">
            <div v-for="(product, index) in topProducts" :key="product.productId" class="product-row">
              <span class="product-rank">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="product-details">
                <strong>{{ product.name }}</strong>
                <span>{{ product.quantity }} {{ product.quantity === 1 ? 'item' : 'items' }} sold</span>
              </div>
              <strong class="product-sales">{{ formatCurrency(product.sales) }}</strong>
            </div>
          </ion-card>
          <section v-else class="empty-state">
            <ion-icon :icon="barChartOutline" />
            <h2>No confirmed sales in this period</h2>
            <p>Orders appear here as soon as you confirm them.</p>
          </section>
        </section>

        <p class="report-note">
          Date ranges use confirmation time where available. Older confirmed orders use their order date. Pending and cancelled orders are excluded.
        </p>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { barChartOutline, downloadOutline } from 'ionicons/icons';
import { listStoreOrders } from '@/services/orderService';
import { getOwnerStore } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { PetFoodOrder, Store } from '@/types';

interface ProductSales {
  productId: string;
  name: string;
  quantity: number;
  sales: number;
}

const authStore = useAuthStore();
const period = ref<'7' | '30' | 'all'>('30');
const allOrders = ref<PetFoodOrder[]>([]);
const store = ref<Store | null>(null);
const loading = ref(true);
const error = ref('');

const periodLabel = computed(() => {
  if (period.value === 'all') return 'All time';
  return `Last ${period.value} days`;
});

const salesOrders = computed(() => {
  const startTime = period.value === 'all'
    ? null
    : Date.now() - Number(period.value) * 24 * 60 * 60 * 1000;
  return allOrders.value.filter((order) => {
    if (order.status !== 'confirmed' && order.status !== 'completed') return false;
    if (startTime === null) return true;
    const confirmedAt = (order.confirmedAt ?? order.completedAt ?? order.createdAt)?.toMillis?.();
    return confirmedAt !== undefined && confirmedAt >= startTime;
  });
});

const totalSales = computed(() =>
  salesOrders.value.reduce((sum, order) => sum + order.total, 0),
);

const itemsSold = computed(() =>
  salesOrders.value.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  ),
);

const averageOrder = computed(() =>
  salesOrders.value.length ? totalSales.value / salesOrders.value.length : 0,
);

const topProducts = computed<ProductSales[]>(() => {
  const byProduct = new Map<string, ProductSales>();
  for (const order of salesOrders.value) {
    for (const item of order.items) {
      const sales = byProduct.get(item.productId) ?? {
        productId: item.productId,
        name: item.name,
        quantity: 0,
        sales: 0,
      };
      sales.quantity += item.quantity;
      sales.sales += item.unitPrice * item.quantity;
      byProduct.set(item.productId, sales);
    }
  }
  return [...byProduct.values()].sort((first, second) => second.sales - first.sales);
});

watch(period, loadOrders);

async function loadOrders(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to view sales reports.');
    const ownerStore = await getOwnerStore(ownerId);
    if (!ownerStore) throw new Error('Create your store profile before viewing reports.');
    store.value = ownerStore;
    allOrders.value = await listStoreOrders(ownerStore.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load sales reports.';
  } finally {
    loading.value = false;
  }
}

function csvCell(value: string | number): string {
  const text = String(value).replace(/^[=+\-@]/, "'$&");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadReport(): void {
  if (!store.value) return;
  const rows: Array<Array<string | number>> = [
    ['Shop', store.value.name],
    ['Address', `${store.value.address}, ${store.value.municipality}`],
    ['Phone', store.value.phone],
    ['Owner', authStore.profile?.displayName ?? ''],
    ['Report generated', new Date().toLocaleString()],
    [],
    ['Sales summary'],
    ['Period', periodLabel.value],
    ['Total sales', totalSales.value.toFixed(2)],
    ['Confirmed orders', salesOrders.value.length],
    ['Items sold', itemsSold.value],
    ['Average order', averageOrder.value.toFixed(2)],
    [],
    ['Best-selling products'],
    ['Product', 'Quantity sold', 'Sales'],
    ...topProducts.value.map((product) => [
      product.name,
      product.quantity,
      product.sales.toFixed(2),
    ]),
    [],
    ['Order details'],
    ['Order ID', 'Sale date', 'Status', 'Items', 'Total'],
    ...salesOrders.value.map((order) => [
      order.id,
      (order.confirmedAt ?? order.completedAt ?? order.createdAt)?.toDate?.().toLocaleString() ?? '',
      order.status,
      order.items.map((item) => `${item.quantity} x ${item.name}`).join('; '),
      order.total.toFixed(2),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  const shopSlug = store.value.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'shop';
  anchor.download = `${shopSlug}-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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

.report-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.2rem;
}

h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.045em;
}

.report-heading p {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.shop-identity {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0.9rem 0 1.1rem;
  padding: 0.75rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.9rem;
  background: var(--ion-card-background);
}

.shop-identity img {
  width: 3.2rem;
  height: 3.2rem;
  flex: none;
  border-radius: 0.7rem;
  object-fit: cover;
}

.shop-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.shop-copy span {
  color: var(--ion-color-primary);
  font-size: 0.58rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.shop-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-copy small {
  overflow-wrap: anywhere;
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.report-heading ion-select {
  flex: none;
  max-width: 9rem;
  padding: 0.6rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 0.75rem;
  background: var(--ion-item-background);
  font-size: 0.78rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.metric-card {
  margin: 0;
  border-radius: 1rem;
}

.metric-card ion-card-content {
  display: grid;
  min-height: 7.2rem;
  align-content: space-between;
  gap: 0.55rem;
  padding: 1rem;
}

.revenue-card {
  border: 0;
  background: linear-gradient(135deg, var(--app-hero-start), var(--app-hero-end));
  color: white;
}

.metric-label {
  color: var(--ion-color-medium);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.revenue-card .metric-label,
.revenue-card .metric-footnote {
  color: rgba(255, 255, 255, 0.82);
}

.metric-card strong {
  overflow-wrap: anywhere;
  font-size: clamp(1.15rem, 5vw, 1.65rem);
  letter-spacing: -0.045em;
}

.metric-footnote {
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.products-section {
  margin-top: 1.8rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.2rem;
}

.section-heading > span {
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.products-card {
  overflow: hidden;
  padding: 0 1rem;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.95rem 0;
}

.product-row + .product-row {
  border-top: 1px solid var(--ion-color-light);
}

.product-rank {
  display: grid;
  flex: none;
  width: 2.2rem;
  height: 2.2rem;
  place-items: center;
  border-radius: 0.7rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 0.72rem;
  font-weight: 750;
}

.product-details {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.2rem;
}

.product-details strong {
  overflow: hidden;
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-details span {
  color: var(--ion-color-medium);
  font-size: 0.75rem;
}

.product-sales {
  flex: none;
  font-size: 0.85rem;
}

.loading-state,
.empty-state {
  display: grid;
  min-height: 12rem;
  place-items: center;
  align-content: center;
  text-align: center;
}

.empty-state ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.7rem;
}

.empty-state h2 {
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.empty-state p,
.report-note {
  color: var(--ion-color-medium);
  font-size: 0.82rem;
  line-height: 1.5;
}

.report-note {
  margin: 1.1rem 0 0;
}

@media (min-width: 680px) {
  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
