<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Find stores</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p class="eyebrow">YOUR NEIGHBORHOOD, YOUR PET'S FAVORITES</p>
      <h1>Find a store</h1>
      <p class="intro">
        Browse stores{{ municipality ? ` in ${municipality}` : '' }} and explore their products.
      </p>
      <ion-searchbar
        v-model="search"
        placeholder="Search by store, area, or address"
        aria-label="Search stores"
        class="store-search"
      />
      <div v-if="!loading && !error && stores.length" class="results-heading">
        <h2>{{ search ? 'Search results' : 'Nearby stores' }}</h2>
        <span>{{ filteredStores.length }} {{ filteredStores.length === 1 ? 'store' : 'stores' }}</span>
      </div>
      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <section v-else-if="!stores.length" class="empty-state">
        <ion-icon :icon="storefrontOutline" />
        <h2>No stores just yet</h2>
        <p>We’re adding local pet food stores. Check back soon.</p>
      </section>
      <section v-else-if="!filteredStores.length" class="empty-state">
        <ion-icon :icon="searchOutline" />
        <h2>No matches found</h2>
        <p>Try a different store name, area, or address.</p>
      </section>
      <StoreCard v-else
        v-for="store in filteredStores"
        :key="store.id"
        :store="store"
        @select="openStore"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { searchOutline, storefrontOutline } from 'ionicons/icons';
import StoreCard from '@/components/StoreCard.vue';
import { listStores } from '@/services/storeService';
import type { Store } from '@/types';

const municipality = import.meta.env.VITE_MUNICIPALITY_NAME?.trim() ?? '';
const router = useRouter();
const stores = ref<Store[]>([]);
const search = ref('');
const loading = ref(true);
const error = ref('');

const filteredStores = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return stores.value.filter((store) =>
    `${store.name} ${store.address} ${store.municipality}`.toLocaleLowerCase().includes(term),
  );
});

function openStore(store: Store): void {
  void router.push(`/stores/${store.id}`);
}

onMounted(async () => {
  try {
    stores.value = await listStores(municipality || undefined);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load stores.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.intro {
  max-width: 27rem;
  margin-top: -0.25rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

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

.store-search {
  --background: #fff;
  --border-radius: 0.9rem;
  --box-shadow: 0 6px 22px rgb(35 51 45 / 5%);
  padding: 0.5rem 0 1rem;
}

.results-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 0 0 0.85rem;
}

.results-heading h2 {
  margin: 0;
  font-size: 1.1rem;
}

.results-heading span {
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.loading-state,
.empty-state {
  display: grid;
  min-height: 13rem;
  place-items: center;
  align-content: center;
  text-align: center;
}

.empty-state ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.7rem;
}

.empty-state h2 {
  margin: 0.8rem 0 0.3rem;
  font-size: 1.15rem;
}

.empty-state p {
  max-width: 18rem;
  margin-top: 0;
  color: var(--ion-color-medium);
}
</style>
