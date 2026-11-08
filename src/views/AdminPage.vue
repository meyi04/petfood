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
          <p>Review accounts, shops, products, and platform orders.</p>
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
          <ion-segment-button value="users"><ion-label>Accounts</ion-label></ion-segment-button>
          <ion-segment-button value="stores"><ion-label>Shops</ion-label></ion-segment-button>
          <ion-segment-button value="products"><ion-label>Products</ion-label></ion-segment-button>
          <ion-segment-button value="orders"><ion-label>Orders</ion-label></ion-segment-button>
        </ion-segment>

        <ion-searchbar
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

        <section v-else class="record-list" aria-label="Order oversight">
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
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
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

type AdminSection = 'users' | 'stores' | 'products' | 'orders';
const validRoles: UserRole[] = ['BUYER', 'OWNER', 'ADMIN'];
const authStore = useAuthStore();
const users = ref<UserProfile[]>([]);
const stores = ref<Store[]>([]);
const products = ref<Product[]>([]);
const orders = ref<PetFoodOrder[]>([]);
const section = ref<AdminSection>('users');
const searchText = ref('');
const loading = ref(true);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');
const busyIds = ref(new Set<string>());
const currentUserId = computed(() => authStore.profile?.uid ?? '');
const adminsCount = computed(() => users.value.filter((user) => user.role === 'ADMIN').length);
const pendingOrdersCount = computed(() => orders.value.filter((order) => order.status === 'pending').length);
const userById = computed(() => new Map(users.value.map((user) => [user.uid, user])));
const storeById = computed(() => new Map(stores.value.map((store) => [store.id, store])));
const normalizedSearch = computed(() => searchText.value.trim().toLocaleLowerCase());
const sectionLabel = computed(() => ({
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
  justify-content: flex-start;
  margin-top: 1.25rem;
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
}
</style>
