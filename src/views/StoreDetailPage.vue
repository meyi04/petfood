<!-- src/views/StoreDetailPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/home" /></ion-buttons>
        <ion-title>{{ store?.name ?? 'Store details' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-spinner v-if="loading" />
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <template v-else-if="store">
        <section class="store-hero" :class="{ 'has-photo': store.imageUrl }">
          <img
            v-if="store.imageUrl"
            class="store-hero-image"
            :src="store.imageUrl"
            :alt="`${store.name} store`"
          />
          <div v-else class="store-hero-icon">
            <ion-icon :icon="storefrontOutline" aria-hidden="true" />
          </div>
          <div class="store-hero-content">
            <p class="store-hero-eyebrow">LOCAL PET STORE</p>
            <h1>{{ store.name }}</h1>
            <p class="store-hero-address">
              <ion-icon :icon="locationOutline" />
              {{ store.address }}, {{ store.municipality }}
            </p>
            <a v-if="store.phone" class="store-hero-phone" :href="`tel:${store.phone}`">
              <ion-icon :icon="callOutline" />
              {{ store.phone }}
            </a>
          </div>
        </section>
        <section class="location-section">
          <div class="section-heading">
            <div>
              <p class="section-eyebrow">COME VISIT</p>
              <h2>Store location</h2>
            </div>
          </div>
          <div class="map-frame">
            <iframe
              :src="mapUrl"
              :title="`Map showing ${store.name} at ${store.address}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
            />
          </div>
          <p class="map-address">{{ store.address }}, {{ store.municipality }}</p>
        </section>

        <div class="section-heading products-heading">
          <div>
            <p class="section-eyebrow">SHOP THE SELECTION</p>
            <h2>Products</h2>
          </div>
        </div>
        <ion-select v-model="category" label="Filter by category" interface="popover">
          <ion-select-option value="">All categories</ion-select-option>
          <ion-select-option v-for="item in PRODUCT_CATEGORIES" :key="item" :value="item">
            {{ item }}
          </ion-select-option>
        </ion-select>
        <ion-searchbar v-model="search" placeholder="Search products" />
        <ion-spinner v-if="productsLoading" />
        <ion-text v-else-if="!filteredProducts.length"><p>No products in this category.</p></ion-text>
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          @select="openProduct"
        />
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonIcon,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { callOutline, locationOutline, storefrontOutline } from 'ionicons/icons';
import ProductCard from '@/components/ProductCard.vue';
import { getStore, listProducts } from '@/services/storeService';
import { PRODUCT_CATEGORIES, type Product, type Store } from '@/types';

const route = useRoute();
const router = useRouter();
const store = ref<Store | null>(null);
const products = ref<Product[]>([]);
const category = ref('');
const search = ref('');
const loading = ref(true);
const productsLoading = ref(false);
const error = ref('');

const mapUrl = computed(() => {
  if (!store.value) return '';
  const coordinates = encodeURIComponent(`${store.value.lat},${store.value.lng}`);
  return `https://maps.google.com/maps?q=${coordinates}&z=15&output=embed`;
});

const filteredProducts = computed(() =>
  products.value.filter((product) => {
    const matchesCategory = !category.value || product.category === category.value;
    const term = search.value.trim().toLocaleLowerCase();
    const matchesSearch = `${product.name} ${product.description}`.toLocaleLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  }),
);

function openProduct(product: Product): void {
  void router.push(`/products/${product.id}`);
}

onMounted(async () => {
  try {
    store.value = await getStore(String(route.params.storeId));
    if (!store.value) throw new Error('This store could not be found.');
    productsLoading.value = true;
    products.value = await listProducts(store.value.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load this store.';
  } finally {
    loading.value = false;
    productsLoading.value = false;
  }
});
</script>

<style scoped>
.store-hero {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 14rem;
  align-items: flex-end;
  overflow: hidden;
  padding: 1.25rem;
  margin: 0.25rem 0 1.5rem;
  border-radius: 1.2rem;
  background: linear-gradient(120deg, #174f45, #257c66 68%, #46977d);
  color: white;
  box-shadow: 0 14px 28px rgb(23 79 69 / 16%);
}

.store-hero.has-photo {
  background: #174f45;
}

.store-hero-image,
.store-hero.has-photo::before {
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
  background: linear-gradient(0deg, rgb(16 53 45 / 94%), rgb(20 68 56 / 52%) 60%, rgb(20 68 56 / 14%));
  content: "";
}

.store-hero-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.store-hero-eyebrow,
.section-eyebrow {
  margin: 0 0 0.35rem;
  color: #c2e4d5;
  font-size: 0.64rem;
  font-weight: 750;
  letter-spacing: 0.09em;
}

.store-hero h1 {
  margin: 0 0 0.55rem;
  color: white;
  font-size: clamp(1.5rem, 7vw, 2rem);
  letter-spacing: -0.04em;
}

.store-hero-address,
.store-hero-phone {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin: 0.35rem 0 0;
  color: #e1f0e9;
  font-size: 0.84rem;
  line-height: 1.45;
  text-decoration: none;
}

.store-hero-address ion-icon,
.store-hero-phone ion-icon {
  flex: none;
  margin-top: 0.1rem;
}

.store-hero-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 12%);
  color: white;
  font-size: 1.5rem;
}

.section-heading {
  margin-bottom: 0.75rem;
}

.section-eyebrow {
  margin-bottom: 0.2rem;
  color: var(--ion-color-primary);
  font-size: 0.63rem;
}

.section-heading h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
}

.products-heading {
  margin-top: 1.5rem;
}

.location-section {
  margin: 1.4rem 0;
}

.map-frame {
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 15rem;
  max-height: 28rem;
  overflow: hidden;
  border: 1px solid rgb(35 51 45 / 8%);
  border-radius: 1rem;
  background: #e8eeeb;
  box-shadow: 0 8px 24px rgb(35 51 45 / 7%);
}

.map-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.map-address {
  margin: 0.55rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .map-frame {
    aspect-ratio: 4 / 3;
    min-height: 13rem;
  }
}
</style>
