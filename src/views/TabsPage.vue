<!-- src/views/TabsPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="app-brand" slot="start">
          <img src="/petfood-mark.svg" alt="" />
          <ion-title>{{ authStore.profile?.role === 'OWNER' ? 'My pet food store' : 'PetFood' }}</ion-title>
        </div>
        <ion-buttons slot="end">
          <ion-button
            :disabled="signingOut"
            :aria-label="signingOut ? 'Signing out' : 'Sign out'"
            @click="logout"
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
      color="danger"
      @did-dismiss="message = ''"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonLabel,
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
  businessOutline,
  barChartOutline,
  homeOutline,
  logOutOutline,
  personCircleOutline,
  pricetagsOutline,
  receiptOutline,
  searchOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const signingOut = ref(false);
const message = ref('');

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
</script>

<style scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.app-brand img {
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
}

.app-brand ion-title {
  position: static;
  padding: 0;
  font-size: 1rem;
}
</style>
