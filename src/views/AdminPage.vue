<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Admin console</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Refresh admin data" :disabled="loading" @click="loadData">
            <ion-icon slot="icon-only" :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">PETFOOD PLATFORM</p>
      <div class="page-heading">
        <div>
          <h1>Administrator</h1>
          <p>Track platform performance and manage accounts, shops, products, and orders.</p>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else>
        <section class="metric-grid" aria-label="Platform totals">
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">ACCOUNTS</span>
              <strong>{{ users.length }}</strong>
              <span class="metric-footnote">{{ adminsCount }} administrator{{ adminsCount === 1 ? '' : 's' }}</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">SHOPS</span>
              <strong>{{ stores.length }}</strong>
              <span class="metric-footnote">Registered stores</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">PRODUCTS</span>
              <strong>{{ products.length }}</strong>
              <span class="metric-footnote">Across registered stores</span>
            </ion-card-content>
          </ion-card>
          <ion-card class="metric-card">
            <ion-card-content>
              <span class="metric-label">ORDERS</span>
              <strong>{{ orders.length }}</strong>
              <span class="metric-footnote">{{ pendingOrdersCount }} pending review</span>
            </ion-card-content>
          </ion-card>
        </section>

        <ion-segment v-model="section" scrollable class="admin-segment">
          <ion-segment-button value="analytics"><ion-label>Analytics</ion-label></ion-segment-button>
          <ion-segment-button value="users"><ion-label>Accounts</ion-label></ion-segment-button>
          <ion-segment-button value="stores"><ion-label>Shops</ion-label></ion-segment-button>
          <ion-segment-button value="products"><ion-label>Products</ion-label></ion-segment-button>
          <ion-segment-button value="orders"><ion-label>Orders</ion-label></ion-segment-button>
        </ion-segment>

        <section v-if="section === 'analytics'" class="analytics-section" aria-label="Platform analytics">
          <div class="analytics-heading">
            <div>
              <p class="eyebrow">PLATFORM PERFORMANCE</p>
              <h2>Analytics overview</h2>
              <p>Sales include confirmed and completed orders. Pending and cancelled orders are excluded.</p>
            </div>
            <ion-select
              v-model="analyticsPeriod"
              class="analytics-period"
              aria-label="Analytics date range"
              interface="popover"
            >
              <ion-select-option value="7">Last 7 days</ion-select-option>
              <ion-select-option value="30">Last 30 days</ion-select-option>
              <ion-select-option value="90">Last 90 days</ion-select-option>
              <ion-select-option value="all">All time</ion-select-option>
            </ion-select>
          </div>

          <section class="analytics-metrics" aria-label="Selected period performance">
            <ion-card class="analytics-metric revenue-metric">
              <ion-card-content>
                <span class="metric-label">PLATFORM SALES</span>
                <strong>{{ formatCurrency(periodSales) }}</strong>
                <span class="metric-footnote">{{ analyticsPeriodLabel }}</span>
              </ion-card-content>
            </ion-card>
            <ion-card class="analytics-metric">
              <ion-card-content>
                <span class="metric-label">SALES ORDERS</span>
                <strong>{{ periodSalesOrders.length }}</strong>
                <span class="metric-footnote">Confirmed or completed</span>
              </ion-card-content>
            </ion-card>
            <ion-card class="analytics-metric">
              <ion-card-content>
                <span class="metric-label">AVERAGE ORDER</span>
                <strong>{{ formatCurrency(periodAverageOrder) }}</strong>
                <span class="metric-footnote">Per sales order</span>
              </ion-card-content>
            </ion-card>
            <ion-card class="analytics-metric">
              <ion-card-content>
                <span class="metric-label">ITEMS SOLD</span>
                <strong>{{ periodItemsSold }}</strong>
                <span class="metric-footnote">Across sales orders</span>
              </ion-card-content>
            </ion-card>
          </section>

          <div class="analytics-grid">
            <ion-card class="analytics-card sales-analytics">
              <ion-card-content>
                <div class="analytics-card-heading">
                  <div>
                    <h3>Sales over time</h3>
                    <p>{{ analyticsPeriodLabel }} · {{ formatCurrency(periodSales) }}</p>
                  </div>
                </div>
                <div
                  v-if="salesByDay.length"
                  class="sales-chart"
                  role="img"
                  :aria-label="`Daily platform sales for ${analyticsPeriodLabel}. Total ${formatCurrency(periodSales)}.`"
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
                    <span class="chart-label">{{ day.showLabel ? day.label : '' }}</span>
                  </div>
                </div>
                <p v-else class="analytics-empty">
                  {{ analyticsPeriod === 'all'
                    ? 'Choose a date range to view the daily sales trend.'
                    : 'There is no sales history for this period yet.' }}
                </p>
              </ion-card-content>
            </ion-card>

            <ion-card class="analytics-card">
              <ion-card-content>
                <div class="analytics-card-heading">
                  <div>
                    <h3>Order status</h3>
                    <p>{{ periodOrders.length }} orders in {{ analyticsPeriodLabel.toLowerCase() }}</p>
                  </div>
                </div>
                <div class="status-list">
                  <div v-for="status in orderStatusSummary" :key="status.name" class="status-row">
                    <div class="status-line">
                      <span class="status-dot" :class="`status-${status.name}`" />
                      <span>{{ status.label }}</span>
                      <strong>{{ status.count }}</strong>
                    </div>
                    <div class="status-track">
                      <span
                        :class="`status-fill status-${status.name}`"
                        :style="{ width: `${status.percentage}%` }"
                      />
                    </div>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>

            <ion-card class="analytics-card">
              <ion-card-content>
                <div class="analytics-card-heading">
                  <div>
                    <h3>Top shops</h3>
                    <p>Ranked by sales in {{ analyticsPeriodLabel.toLowerCase() }}</p>
                  </div>
                </div>
                <div v-if="topStores.length" class="ranking-list">
                  <div v-for="(store, index) in topStores" :key="store.storeId" class="ranking-row">
                    <span class="ranking-number">{{ String(index + 1).padStart(2, '0') }}</span>
                    <div class="ranking-copy">
                      <strong>{{ store.name }}</strong>
                      <span>{{ store.orderCount }} {{ store.orderCount === 1 ? 'order' : 'orders' }}</span>
                    </div>
                    <strong class="ranking-value">{{ formatCurrency(store.sales) }}</strong>
                  </div>
                </div>
                <p v-else class="analytics-empty">No shop sales to rank for this period.</p>
              </ion-card-content>
            </ion-card>

            <ion-card class="analytics-card">
              <ion-card-content>
                <div class="analytics-card-heading">
                  <div>
                    <h3>Popular categories</h3>
                    <p>Items sold in {{ analyticsPeriodLabel.toLowerCase() }}</p>
                  </div>
                </div>
                <div v-if="topCategories.length" class="category-list">
                  <div v-for="category in topCategories" :key="category.name" class="category-row">
                    <div class="category-copy">
                      <strong>{{ category.name }}</strong>
                      <span>{{ category.quantity }} {{ category.quantity === 1 ? 'item' : 'items' }}</span>
                    </div>
                    <strong>{{ formatCurrency(category.sales) }}</strong>
                  </div>
                </div>
                <p v-else class="analytics-empty">No product sales to summarize for this period.</p>
              </ion-card-content>
            </ion-card>
          </div>
        </section>

        <ion-searchbar
          v-if="section !== 'analytics'"
          v-model="searchText"
          class="admin-search"
          :placeholder="`Search ${sectionLabel.toLowerCase()}`"
          :aria-label="`Search ${sectionLabel.toLowerCase()}`"
          :debounce="150"
        />

        <section v-if="section === 'users'" class="record-list" aria-label="Account management">
          <ion-card v-for="user in filteredUsers" :key="user.uid" class="record-card">
            <ion-card-content>
              <div class="record-heading">
                <div class="record-copy">
                  <strong>{{ user.displayName || 'Unnamed account' }}</strong>
                  <span>{{ user.email }}</span>
                  <small>UID {{ user.uid }}</small>
                </div>
                <ion-select
                  :value="user.role"
                  label="Role"
                  label-placement="stacked"
                  interface="popover"
                  :disabled="user.uid === currentUserId || busyIds.has(user.uid)"
                  @ionChange="changeUserRole(user, $event.detail.value)"
                >
                  <ion-select-option value="BUYER">Buyer</ion-select-option>
                  <ion-select-option value="OWNER">Owner</ion-select-option>
                  <ion-select-option value="ADMIN">Admin</ion-select-option>
                </ion-select>
              </div>
            </ion-card-content>
          </ion-card>
          <p v-if="!filteredUsers.length" class="empty-note">No accounts match your search.</p>
        </section>

        <section v-else-if="section === 'stores'" class="record-list" aria-label="Shop management">
          <ion-card v-for="store in filteredStores" :key="store.id" class="record-card">
            <ion-card-content>
              <div class="record-heading">
                <div class="record-copy">
                  <strong>{{ store.name }}</strong>
                  <span>{{ store.address }}, {{ store.municipality }}</span>
                  <small>Owner: {{ userById.get(store.ownerId)?.email || store.ownerId }}</small>
                </div>
                <ion-button
                  color="danger"
                  fill="outline"
                  :disabled="busyIds.has(store.id)"
                  @click="removeStore(store)"
                >
                  Remove
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
          <p v-if="!filteredStores.length" class="empty-note">No shops match your search.</p>
        </section>

        <section v-else-if="section === 'products'" class="record-list" aria-label="Product moderation">
          <ion-card v-for="product in filteredProducts" :key="product.id" class="record-card">
            <ion-card-content>
              <div class="record-heading">
                <div class="record-copy">
                  <strong>{{ product.name }}</strong>
                  <span>{{ storeById.get(product.storeId)?.name || 'Unknown shop' }} · {{ product.category }}</span>
                  <small>{{ formatCurrency(product.price) }} · {{ product.description }}</small>
                </div>
                <ion-button
                  color="danger"
                  fill="outline"
                  :disabled="busyIds.has(product.id)"
                  @click="removeProduct(product)"
                >
                  Remove
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
          <p v-if="!filteredProducts.length" class="empty-note">No products match your search.</p>
        </section>

        <section v-else-if="section === 'orders'" class="record-list" aria-label="Order oversight">
          <ion-card v-for="order in filteredOrders" :key="order.id" class="record-card">
            <ion-card-content>
              <div class="order-heading">
                <div class="record-copy">
                  <strong>Order #{{ order.id.slice(0, 8).toUpperCase() }}</strong>
                  <span>{{ storeById.get(order.storeId)?.name || order.storeId }} · {{ formatCurrency(order.total) }}</span>
                  <small>Buyer {{ order.buyerId }} · {{ formatDate(order) }}</small>
                </div>
                <ion-badge :color="statusColor(order.status)">{{ order.status }}</ion-badge>
              </div>
              <div class="order-items">
                <span v-for="item in order.items" :key="item.productId">
                  {{ item.quantity }} × {{ item.name }}
                </span>
              </div>
              <div v-if="nextStatuses(order.status).length" class="order-actions">
                <ion-button
                  v-for="status in nextStatuses(order.status)"
                  :key="status"
                  :color="status === 'cancelled' ? 'danger' : 'primary'"
                  :fill="status === 'cancelled' ? 'outline' : 'solid'"
                  :disabled="busyIds.has(order.id)"
                  @click="changeOrderStatus(order, status)"
                >
                  {{ statusActionLabel(status) }}
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
          <p v-if="!filteredOrders.length" class="empty-note">No orders match your search.</p>
        </section>
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
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
  onIonViewWillEnter,
} from '@ionic/vue';
import { refreshOutline } from 'ionicons/icons';
import {
  deleteAdminProduct,
  deleteAdminStore,
  listAdminOrders,
  listAdminProducts,
  listAdminStores,
  listAdminUsers,
  updateAdminUserRole,
} from '@/services/adminService';
import { updateStoreOrderStatus } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { OrderStatus, PetFoodOrder, Product, Store, UserProfile, UserRole } from '@/types';

type AdminSection = 'analytics' | 'users' | 'stores' | 'products' | 'orders';
type AnalyticsPeriod = '7' | '30' | '90' | 'all';
interface DailySales {
  key: string;
  label: string;
  amount: number;
  height: number;
  showLabel: boolean;
}
interface StoreSales {
  storeId: string;
  name: string;
  sales: number;
  orderCount: number;
}
interface CategorySales {
  name: string;
  sales: number;
  quantity: number;
}
const validRoles: UserRole[] = ['BUYER', 'OWNER', 'ADMIN'];
const authStore = useAuthStore();
const users = ref<UserProfile[]>([]);
const stores = ref<Store[]>([]);
const products = ref<Product[]>([]);
const orders = ref<PetFoodOrder[]>([]);
const section = ref<AdminSection>('analytics');
const analyticsPeriod = ref<AnalyticsPeriod>('30');
const searchText = ref('');
const loading = ref(true);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');
const busyIds = ref(new Set<string>());
const currentUserId = computed(() => authStore.profile?.uid ?? '');
const adminsCount = computed(() => users.value.filter((user) => user.role === 'ADMIN').length);
const pendingOrdersCount = computed(() => orders.value.filter((order) => order.status === 'pending').length);
const analyticsPeriodLabel = computed(() => {
  if (analyticsPeriod.value === 'all') return 'All time';
  return `Last ${analyticsPeriod.value} days`;
});
const periodStart = computed(() => {
  if (analyticsPeriod.value === 'all') return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(analyticsPeriod.value) + 1);
  return start;
});
const periodOrders = computed(() => {
  const start = periodStart.value;
  return orders.value.filter((order) => {
    if (!start) return true;
    const date = order.createdAt?.toDate?.();
    return date !== undefined && date >= start;
  });
});
function salesDate(order: PetFoodOrder): Date | undefined {
  const timestamp = order.confirmedAt ?? order.completedAt ?? order.createdAt;
  return timestamp?.toDate?.();
}
const periodSalesOrders = computed(() => {
  const start = periodStart.value;
  return orders.value.filter((order) => {
    if (order.status !== 'confirmed' && order.status !== 'completed') return false;
    const date = salesDate(order);
    return date !== undefined && (!start || date >= start);
  });
});
const periodSales = computed(() =>
  periodSalesOrders.value.reduce((sum, order) => sum + order.total, 0),
);
const periodItemsSold = computed(() =>
  periodSalesOrders.value.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  ),
);
const periodAverageOrder = computed(() =>
  periodSalesOrders.value.length ? periodSales.value / periodSalesOrders.value.length : 0,
);
const salesByDay = computed<DailySales[]>(() => {
  if (analyticsPeriod.value === 'all') return [];
  const count = Number(analyticsPeriod.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - count + index + 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return {
      key,
      date,
      amount: 0,
      label: count === 7
        ? new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
        : new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric' }).format(date),
      showLabel: count === 7 || index % (count === 30 ? 5 : 15) === 0 || index === count - 1,
    };
  });
  const byDay = new Map(days.map((day) => [day.key, day]));
  for (const order of periodSalesOrders.value) {
    const date = salesDate(order);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const day = byDay.get(key);
    if (day) day.amount += order.total;
  }
  const maxAmount = Math.max(...days.map((day) => day.amount));
  return days.map((day) => ({
    key: day.key,
    label: day.label,
    amount: day.amount,
    showLabel: day.showLabel,
    height: maxAmount > 0 ? Math.max((day.amount / maxAmount) * 100, 4) : 0,
  }));
});
const orderStatusSummary = computed(() => {
  const statuses: Array<{ name: OrderStatus; label: string }> = [
    { name: 'pending', label: 'Pending' },
    { name: 'confirmed', label: 'Confirmed' },
    { name: 'completed', label: 'Completed' },
    { name: 'cancelled', label: 'Cancelled' },
  ];
  return statuses.map((status) => {
    const count = periodOrders.value.filter((order) => order.status === status.name).length;
    return {
      ...status,
      count,
      percentage: periodOrders.value.length ? (count / periodOrders.value.length) * 100 : 0,
    };
  });
});
const topStores = computed<StoreSales[]>(() => {
  const totals = new Map<string, StoreSales>();
  for (const order of periodSalesOrders.value) {
    const total = totals.get(order.storeId) ?? {
      storeId: order.storeId,
      name: storeById.value.get(order.storeId)?.name ?? 'Unknown shop',
      sales: 0,
      orderCount: 0,
    };
    total.sales += order.total;
    total.orderCount += 1;
    totals.set(order.storeId, total);
  }
  return [...totals.values()].sort((first, second) => second.sales - first.sales).slice(0, 5);
});
const topCategories = computed<CategorySales[]>(() => {
  const categories = new Map<string, CategorySales>();
  const productById = new Map(products.value.map((product) => [product.id, product]));
  for (const order of periodSalesOrders.value) {
    for (const item of order.items) {
      const product = productById.get(item.productId);
      const name = product?.category || 'Other';
      const total = categories.get(name) ?? { name, sales: 0, quantity: 0 };
      total.sales += item.unitPrice * item.quantity;
      total.quantity += item.quantity;
      categories.set(name, total);
    }
  }
  return [...categories.values()].sort((first, second) => second.quantity - first.quantity).slice(0, 5);
});
const userById = computed(() => new Map(users.value.map((user) => [user.uid, user])));
const storeById = computed(() => new Map(stores.value.map((store) => [store.id, store])));
const normalizedSearch = computed(() => searchText.value.trim().toLocaleLowerCase());
const sectionLabel = computed(() => ({
  analytics: 'Analytics',
  users: 'Accounts',
  stores: 'Shops',
  products: 'Products',
  orders: 'Orders',
}[section.value]));

const filteredUsers = computed(() => users.value.filter((user) =>
  `${user.displayName} ${user.email} ${user.uid} ${user.role}`.toLocaleLowerCase().includes(normalizedSearch.value),
));
const filteredStores = computed(() => stores.value.filter((store) =>
  `${store.name} ${store.address} ${store.municipality} ${userById.value.get(store.ownerId)?.email ?? ''}`
    .toLocaleLowerCase().includes(normalizedSearch.value),
));
const filteredProducts = computed(() => products.value.filter((product) =>
  `${product.name} ${product.category} ${product.description} ${storeById.value.get(product.storeId)?.name ?? ''}`
    .toLocaleLowerCase().includes(normalizedSearch.value),
));
const filteredOrders = computed(() => orders.value.filter((order) =>
  `${order.id} ${order.buyerId} ${order.storeId} ${storeById.value.get(order.storeId)?.name ?? ''} ${order.status} ${order.items.map((item) => item.name).join(' ')}`
    .toLocaleLowerCase().includes(normalizedSearch.value),
));

async function loadData(): Promise<void> {
  loading.value = true;
  error.value = '';
  try {
    const [nextUsers, nextStores, nextProducts, nextOrders] = await Promise.all([
      listAdminUsers(),
      listAdminStores(),
      listAdminProducts(),
      listAdminOrders(),
    ]);
    users.value = nextUsers;
    stores.value = nextStores;
    products.value = nextProducts;
    orders.value = nextOrders;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load administrator data.';
  } finally {
    loading.value = false;
  }
}

async function changeUserRole(user: UserProfile, value: unknown): Promise<void> {
  if (!validRoles.includes(value as UserRole) || value === user.role) return;
  const role = value as UserRole;
  busyIds.value = new Set([...busyIds.value, user.uid]);
  try {
    await updateAdminUserRole(user.uid, role);
    user.role = role;
    messageColor.value = 'success';
    message.value = `${user.displayName || user.email || 'Account'} is now ${role.toLowerCase()}.`;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not update this account role.';
  } finally {
    const nextIds = new Set(busyIds.value);
    nextIds.delete(user.uid);
    busyIds.value = nextIds;
  }
}

async function removeStore(store: Store): Promise<void> {
  if (!window.confirm(`Remove "${store.name}"? Shops with products or order history cannot be removed.`)) return;
  busyIds.value = new Set([...busyIds.value, store.id]);
  try {
    await deleteAdminStore(store.id);
    stores.value = stores.value.filter((item) => item.id !== store.id);
    messageColor.value = 'success';
    message.value = 'Shop removed.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not remove this shop.';
  } finally {
    const nextIds = new Set(busyIds.value);
    nextIds.delete(store.id);
    busyIds.value = nextIds;
  }
}

async function removeProduct(product: Product): Promise<void> {
  if (!window.confirm(`Remove "${product.name}" from the catalog?`)) return;
  busyIds.value = new Set([...busyIds.value, product.id]);
  try {
    await deleteAdminProduct(product.id);
    products.value = products.value.filter((item) => item.id !== product.id);
    messageColor.value = 'success';
    message.value = 'Product removed.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not remove this product.';
  } finally {
    const nextIds = new Set(busyIds.value);
    nextIds.delete(product.id);
    busyIds.value = nextIds;
  }
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
  return status === 'confirmed' ? 'Confirm' : status === 'completed' ? 'Complete' : 'Cancel';
}

function statusColor(status: OrderStatus): string {
  if (status === 'confirmed') return 'success';
  if (status === 'completed') return 'primary';
  if (status === 'cancelled') return 'medium';
  return 'warning';
}

function formatDate(order: PetFoodOrder): string {
  return order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Recently placed';
}

async function changeOrderStatus(order: PetFoodOrder, status: OrderStatus): Promise<void> {
  if (status === 'cancelled' && !window.confirm(`Cancel order #${order.id.slice(0, 8).toUpperCase()}?`)) return;
  busyIds.value = new Set([...busyIds.value, order.id]);
  try {
    await updateStoreOrderStatus(order, status);
    order.status = status;
    messageColor.value = 'success';
    message.value = `Order ${status}.`;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not update this order.';
  } finally {
    const nextIds = new Set(busyIds.value);
    nextIds.delete(order.id);
    busyIds.value = nextIds;
  }
}

onIonViewWillEnter(loadData);
</script>

<style scoped>
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.page-heading h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: -0.045em;
}

.page-heading p {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 1.1rem 0;
}

.metric-card {
  margin: 0;
  border-radius: 0.9rem;
}

.metric-card ion-card-content {
  display: grid;
  min-height: 6rem;
  align-content: space-between;
  gap: 0.35rem;
  padding: 0.9rem;
}

.metric-label {
  color: var(--ion-color-medium);
  font-size: 0.6rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.metric-card strong {
  font-size: 1.5rem;
}

.metric-footnote,
.record-copy span,
.record-copy small {
  color: var(--ion-color-medium);
  font-size: 0.74rem;
  line-height: 1.45;
}

.admin-segment {
  margin: 1.25rem 0 1rem;
}

.analytics-section {
  display: grid;
  gap: 1rem;
}

.analytics-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.analytics-heading h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.035em;
}

.analytics-heading > div > p:last-child {
  margin: 0.35rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.77rem;
  line-height: 1.45;
}

.analytics-period {
  flex: none;
  width: 9.5rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.7rem;
  background: var(--ion-card-background);
  font-size: 0.76rem;
}

.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.analytics-metric {
  margin: 0;
  border-radius: 0.9rem;
}

.analytics-metric ion-card-content {
  display: grid;
  min-height: 6rem;
  align-content: space-between;
  gap: 0.35rem;
  padding: 0.9rem;
}

.analytics-metric > ion-card-content > strong {
  overflow: hidden;
  font-size: clamp(1.05rem, 4vw, 1.4rem);
  letter-spacing: -0.035em;
  text-overflow: ellipsis;
}

.revenue-metric {
  border: 0;
  background: linear-gradient(135deg, var(--app-hero-start), var(--app-hero-end));
  color: white;
}

.revenue-metric .metric-label,
.revenue-metric .metric-footnote {
  color: rgba(255, 255, 255, 0.8);
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.85rem;
}

.analytics-card {
  min-width: 0;
  margin: 0;
  border-radius: 0.95rem;
}

.analytics-card ion-card-content {
  padding: 1rem;
}

.analytics-card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  margin-bottom: 0.9rem;
}

.analytics-card-heading h3 {
  margin: 0;
  font-size: 0.98rem;
  letter-spacing: -0.02em;
}

.analytics-card-heading p {
  margin: 0.3rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.72rem;
}

.sales-chart {
  display: flex;
  min-height: 12.5rem;
  align-items: stretch;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.2rem 0 0.35rem;
  scrollbar-width: thin;
}

.chart-column {
  display: grid;
  flex: 1 0 2.1rem;
  min-width: 2.1rem;
  grid-template-rows: 1.5rem 1fr 1.2rem;
  justify-items: center;
  gap: 0.25rem;
}

.chart-value,
.chart-label {
  max-width: 100%;
  overflow: hidden;
  color: var(--ion-color-medium);
  font-size: 0.58rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-track {
  display: flex;
  width: min(100%, 1.35rem);
  height: 100%;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 0.45rem;
  background: var(--app-surface-muted);
}

.chart-bar {
  width: 100%;
  min-height: 0;
  border-radius: 0.45rem;
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  transition: height 200ms ease;
}

.chart-bar.has-sales {
  background: linear-gradient(180deg, var(--ion-color-secondary), var(--ion-color-primary));
}

.analytics-empty {
  display: grid;
  min-height: 8rem;
  place-items: center;
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
  text-align: center;
}

.status-list,
.ranking-list,
.category-list {
  display: grid;
  gap: 0.9rem;
}

.status-row {
  display: grid;
  gap: 0.4rem;
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.76rem;
}

.status-line strong {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.status-dot {
  width: 0.55rem;
  height: 0.55rem;
  flex: none;
  border-radius: 50%;
}

.status-pending {
  background-color: var(--ion-color-warning);
}

.status-confirmed {
  background-color: var(--ion-color-secondary);
}

.status-completed {
  background-color: var(--ion-color-primary);
}

.status-cancelled {
  background-color: var(--ion-color-medium);
}

.status-track {
  height: 0.38rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-muted);
}

.status-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.ranking-row,
.category-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.ranking-row + .ranking-row,
.category-row + .category-row {
  padding-top: 0.75rem;
  border-top: 1px solid var(--ion-border-color);
}

.ranking-number {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: none;
  place-items: center;
  border-radius: 0.65rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 0.68rem;
  font-weight: 750;
}

.ranking-copy,
.category-copy {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.2rem;
}

.ranking-copy strong,
.category-copy strong {
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-copy span,
.category-copy span {
  color: var(--ion-color-medium);
  font-size: 0.68rem;
}

.ranking-value,
.category-row > strong {
  flex: none;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.admin-segment {
  justify-content: flex-start;
}

.admin-segment ion-segment-button {
  min-width: 5.2rem;
  font-size: 0.74rem;
}

.admin-search {
  --background: var(--ion-card-background);
  --border-radius: 0.8rem;
  --box-shadow: none;
  padding: 0.65rem 0 0.35rem;
}

.record-list {
  display: grid;
  gap: 0.6rem;
}

.record-card {
  margin: 0;
  border-radius: 0.85rem;
}

.record-card ion-card-content {
  padding: 0.9rem;
}

.record-heading,
.order-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.record-copy {
  display: grid;
  min-width: 0;
  gap: 0.22rem;
}

.record-copy strong {
  overflow-wrap: anywhere;
  font-size: 0.92rem;
}

.record-copy small {
  overflow-wrap: anywhere;
  font-size: 0.68rem;
}

.record-heading ion-select {
  flex: none;
  width: 7.7rem;
  padding: 0.4rem;
  border: 1px solid var(--ion-color-light);
  border-radius: 0.65rem;
  background: var(--ion-item-background);
  font-size: 0.76rem;
}

.order-heading ion-badge {
  flex: none;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.8rem;
  margin-top: 0.75rem;
  color: var(--ion-color-medium);
  font-size: 0.75rem;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.empty-note {
  padding: 1rem;
  color: var(--ion-color-medium);
  text-align: center;
}

.loading-state {
  display: grid;
  min-height: 12rem;
  place-items: center;
}

@media (min-width: 680px) {
  .metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .analytics-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .analytics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sales-analytics {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .analytics-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .analytics-period {
    width: 100%;
  }
}
</style>
