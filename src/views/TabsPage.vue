<!-- src/views/TabsPage.vue -->
<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar class="app-toolbar">
        <div class="app-brand" slot="start">
          <img src="/petfood-mark.svg" alt="" />
          <div class="brand-copy">
            <ion-title>{{ authStore.profile?.role === 'OWNER' ? 'My pet food store' : 'PetFood' }}</ion-title>
            <span>{{ authStore.profile?.role === 'OWNER' ? 'OWNER SPACE' : 'PET PARENT' }}</span>
          </div>
        </div>
        <ion-buttons slot="end">
          <ThemeToggleButton />
          <ion-button
            v-if="authStore.profile?.role === 'OWNER'"
            class="notification-button"
            :aria-label="unreadOrderCount
              ? `${unreadOrderCount} unread order notification${unreadOrderCount === 1 ? '' : 's'}`
              : 'No unread order notifications'"
            @click="openNotifications"
          >
            <ion-icon slot="icon-only" :icon="notificationsOutline" />
            <ion-badge v-if="unreadOrderCount" color="danger" class="notification-count">
              {{ unreadOrderCount > 99 ? '99+' : unreadOrderCount }}
            </ion-badge>
          </ion-button>
          <ion-button
            class="signout-button"
            :disabled="signingOut"
            :aria-label="signingOut ? 'Signing out' : 'Sign out'"
            @click="logoutAlertOpen = true"
          >
            <ion-spinner v-if="signingOut" name="crescent" />
            <ion-icon v-else slot="icon-only" :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <template v-if="authStore.profile?.role === 'OWNER'">
          <ion-tab-button tab="owner" href="/tabs/owner">
            <ion-icon :icon="storefrontOutline" />
            <ion-label>Dashboard</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="owner-orders" href="/tabs/owner-orders">
            <ion-icon :icon="receiptOutline" />
            <ion-label>Orders</ion-label>
            <ion-badge v-if="pendingOrders.length" color="danger">
              {{ pendingOrders.length > 99 ? '99+' : pendingOrders.length }}
            </ion-badge>
          </ion-tab-button>
          <ion-tab-button tab="manage-store" href="/tabs/manage-store">
            <ion-icon :icon="businessOutline" />
            <ion-label>My store</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="products" href="/tabs/products">
            <ion-icon :icon="pricetagsOutline" />
            <ion-label>Products</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="reports" href="/tabs/reports">
            <ion-icon :icon="barChartOutline" />
            <ion-label>Reports</ion-label>
          </ion-tab-button>
        </template>
        <template v-else>
          <ion-tab-button tab="home" href="/tabs/home">
            <ion-icon :icon="homeOutline" />
            <ion-label>Home</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="stores" href="/tabs/stores">
            <ion-icon :icon="searchOutline" />
            <ion-label>Find stores</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="nearby" href="/tabs/nearby">
            <ion-icon :icon="locationOutline" />
            <ion-label>Nearby</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="orders" href="/tabs/orders">
            <ion-icon :icon="receiptOutline" />
            <ion-label>My orders</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="account" href="/tabs/account">
            <ion-icon :icon="personCircleOutline" />
            <ion-label>Account</ion-label>
          </ion-tab-button>
        </template>
      </ion-tab-bar>
    </ion-tabs>
    <ion-toast
      :is-open="Boolean(message)"
      :message="message"
      duration="3500"
      :color="messageColor"
      @did-dismiss="message = ''"
    />
    <ion-alert
      :is-open="logoutAlertOpen"
      header="Sign out?"
      message="Are you sure you want to log out of your account?"
      :buttons="logoutAlertButtons"
      @did-dismiss="logoutAlertOpen = false"
    />
    <ion-modal
      :is-open="notificationsOpen"
      @did-dismiss="notificationsOpen = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Order notifications</ion-title>
          <ion-buttons slot="end">
            <ion-button aria-label="Close notifications" @click="notificationsOpen = false">
              <ion-icon slot="icon-only" :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding notification-content">
        <p v-if="pendingOrders.length" class="notification-intro">
          {{ pendingOrders.length }} order{{ pendingOrders.length === 1 ? '' : 's' }} waiting for your response.
        </p>
        <section v-else class="notification-empty">
          <ion-icon :icon="notificationsOutline" />
          <h2>You're all caught up</h2>
          <p>New orders will show up here as soon as they arrive.</p>
        </section>
        <ion-card v-for="order in pendingOrders" :key="order.id" class="notification-card">
          <ion-card-content>
            <div class="notification-order-heading">
              <strong>Order #{{ order.id.slice(0, 8).toUpperCase() }}</strong>
              <ion-badge color="warning">Pending</ion-badge>
            </div>
            <p>{{ order.items.length }} item{{ order.items.length === 1 ? '' : 's' }} · {{ formatCurrency(order.total) }}</p>
            <span>{{ formatOrderDate(order) }}</span>
          </ion-card-content>
        </ion-card>
        <ion-button
          v-if="pendingOrders.length"
          expand="block"
          class="view-orders-button"
          @click="openOwnerOrders"
        >
          View all orders
          <ion-icon slot="end" :icon="arrowForwardOutline" />
        </ion-button>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonModal,
  IonPage,
  IonRouterOutlet,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import {
  arrowForwardOutline,
  closeOutline,
  locationOutline,
  businessOutline,
  barChartOutline,
  homeOutline,
  logOutOutline,
  notificationsOutline,
  personCircleOutline,
  pricetagsOutline,
  receiptOutline,
  searchOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { getOwnerStore } from '@/services/storeService';
import { subscribeToStoreOrders } from '@/services/orderService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { PetFoodOrder } from '@/types';
import ThemeToggleButton from '@/components/ThemeToggleButton.vue';

const authStore = useAuthStore();
const router = useRouter();
const signingOut = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'danger'>('danger');
const logoutAlertOpen = ref(false);
const notificationsOpen = ref(false);
const pendingOrders = ref<PetFoodOrder[]>([]);
const readOrderIds = ref(new Set<string>());
const seenOrderIds = new Set<string>();
let receivedInitialSnapshot = false;
let componentUnmounted = false;
let notificationSetupPending = false;
let unsubscribeOrders: (() => void) | undefined;
let readStateOwnerId = '';

const unreadOrderCount = computed(() =>
  pendingOrders.value.filter((order) => !readOrderIds.value.has(order.id)).length,
);

const logoutAlertButtons = [
  { text: 'Stay signed in', role: 'cancel' },
  { text: 'Log out', role: 'destructive', handler: () => { void logout(); } },
];

function formatOrderDate(order: PetFoodOrder): string {
  return order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Just now';
}

function openOwnerOrders(): void {
  notificationsOpen.value = false;
  void router.push('/tabs/owner-orders');
}

function notificationStorageKey(ownerId: string): string {
  return `petfood:read-order-notifications:${ownerId}`;
}

function loadReadOrderIds(ownerId: string): void {
  if (readStateOwnerId === ownerId) return;
  readStateOwnerId = ownerId;
  try {
    const savedIds = localStorage.getItem(notificationStorageKey(ownerId));
    if (!savedIds) {
      readOrderIds.value = new Set();
      return;
    }
    const parsed: unknown = JSON.parse(savedIds);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
      throw new Error('Saved notification state is invalid.');
    }
    readOrderIds.value = new Set(parsed);
  } catch {
    readOrderIds.value = new Set();
    messageColor.value = 'danger';
    message.value = 'Could not restore read notification status on this device.';
  }
}

function persistReadOrderIds(ids: Set<string>): void {
  const ownerId = authStore.profile?.uid;
  if (!ownerId) return;
  try {
    localStorage.setItem(notificationStorageKey(ownerId), JSON.stringify([...ids]));
  } catch {
    messageColor.value = 'danger';
    message.value = 'Notifications are marked read for now, but this could not be saved on this device.';
  }
}

function openNotifications(): void {
  const nextReadIds = new Set(readOrderIds.value);
  pendingOrders.value.forEach((order) => nextReadIds.add(order.id));
  readOrderIds.value = nextReadIds;
  persistReadOrderIds(nextReadIds);
  notificationsOpen.value = true;
}

async function startOrderNotifications(): Promise<void> {
  if (
    authStore.profile?.role !== 'OWNER' ||
    unsubscribeOrders ||
    notificationSetupPending ||
    componentUnmounted
  ) return;
  notificationSetupPending = true;
  try {
    const ownerId = authStore.profile.uid;
    loadReadOrderIds(ownerId);
    const store = await getOwnerStore(ownerId);
    if (!store || componentUnmounted || unsubscribeOrders) return;
    unsubscribeOrders = subscribeToStoreOrders(
      store.id,
      (orders) => {
        const nextPendingOrders = orders.filter((order) => order.status === 'pending');
        const existingOrderIds = new Set(orders.map((order) => order.id));
        const currentReadIds = readOrderIds.value;
        const nextReadIds = new Set([...currentReadIds].filter((id) => existingOrderIds.has(id)));
        if (nextReadIds.size !== currentReadIds.size) {
          readOrderIds.value = nextReadIds;
          persistReadOrderIds(nextReadIds);
        }
        if (receivedInitialSnapshot) {
          const newOrders = nextPendingOrders.filter((order) => !seenOrderIds.has(order.id));
          if (newOrders.length) {
            messageColor.value = 'success';
            message.value = newOrders.length === 1
              ? 'You received a new order.'
              : `You received ${newOrders.length} new orders.`;
          }
        }
        orders.forEach((order) => seenOrderIds.add(order.id));
        receivedInitialSnapshot = true;
        pendingOrders.value = nextPendingOrders;
      },
      (cause) => {
        messageColor.value = 'danger';
        message.value = cause.message || 'Could not receive live order updates.';
      },
    );
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not receive order updates.';
  } finally {
    notificationSetupPending = false;
  }
}

async function logout(): Promise<void> {
  signingOut.value = true;
  try {
    await authStore.logout();
    await router.replace('/login');
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : 'Could not sign out.';
  } finally {
    signingOut.value = false;
  }
}

watch(() => router.currentRoute.value.path, () => {
  if (!unsubscribeOrders) void startOrderNotifications();
});
onMounted(() => { void startOrderNotifications(); });
onBeforeUnmount(() => {
  componentUnmounted = true;
  unsubscribeOrders?.();
});
</script>

<style scoped>
.app-header {
  box-shadow: 0 4px 18px rgb(35 51 45 / 5%);
}

.app-toolbar {
  --background: var(--ion-toolbar-background);
  --border-width: 0 0 1px;
  --border-color: var(--ion-border-color);
  --min-height: 4.5rem;
  --padding-start: 1rem;
  --padding-end: 0.75rem;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-brand img {
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.85rem;
  box-shadow: 0 3px 10px rgb(25 123 104 / 16%);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.brand-copy ion-title {
  position: static;
  padding: 0;
  color: var(--ion-text-color);
  font-size: 1.05rem;
  font-weight: 750;
  letter-spacing: -0.025em;
}

.brand-copy span {
  color: var(--ion-color-medium);
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.12em;
  line-height: 1;
}

.signout-button {
  width: 2.65rem;
  height: 2.65rem;
  margin: 0;
  --background: var(--ion-color-light);
  --background-hover: var(--ion-color-light-shade);
  --border-radius: 0.85rem;
  --color: var(--ion-text-color);
}

.notification-button {
  position: relative;
  width: 2.65rem;
  height: 2.65rem;
  margin: 0;
  --background: var(--ion-color-light);
  --background-hover: var(--ion-color-light-shade);
  --border-radius: 0.85rem;
  --color: var(--ion-text-color);
}

.notification-count {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.1rem;
  min-height: 1.1rem;
  padding: 0.15rem 0.25rem;
  border: 2px solid var(--ion-toolbar-background);
  border-radius: 999px;
  font-size: 0.58rem;
  pointer-events: none;
}

.notification-button ion-icon,
.signout-button ion-icon {
  font-size: 1.2rem;
}

.notification-content {
  --background: var(--ion-background-color);
}

.notification-intro {
  color: var(--ion-color-medium);
}

.notification-card {
  margin: 0.7rem 0;
}

.notification-card ion-card-content {
  display: grid;
  gap: 0.4rem;
}

.notification-order-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.notification-order-heading ion-badge {
  text-transform: capitalize;
}

.notification-card p,
.notification-card span {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
}

.notification-empty {
  display: grid;
  min-height: 55vh;
  align-content: center;
  justify-items: center;
  text-align: center;
}

.notification-empty ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.5rem;
}

.notification-empty h2 {
  margin-bottom: 0.3rem;
}

.notification-empty p {
  color: var(--ion-color-medium);
}

.view-orders-button {
  margin-top: 1rem;
}
</style>
