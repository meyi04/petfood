<!-- src/views/HomePage.vue -->
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>PetFood</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <section class="welcome">
        <div class="welcome-copy">
          <p class="eyebrow">A LITTLE MORE TAIL-WAGGING</p>
          <h1>Good food.<br />Happy pets.</h1>
          <p>Discover pet essentials from stores in your neighborhood.</p>
          <ion-button router-link="/tabs/stores">
            Explore stores
            <ion-icon slot="end" :icon="arrowForwardOutline" />
          </ion-button>
        </div>
        <div class="hero-art" aria-hidden="true">
          <ion-icon :icon="pawOutline" />
        </div>
      </section>

      <section class="section-heading">
        <div>
          <p class="eyebrow">HANDPICKED FOR YOU</p>
          <h2>Stores to explore</h2>
          <p class="location">
            <ion-icon :icon="locationOutline" />
            {{ municipality || 'Local pet stores' }}
          </p>
        </div>
        <ion-button fill="clear" router-link="/tabs/stores">See all</ion-button>
      </section>
      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <section v-else-if="!featuredStores.length" class="empty-stores">
        <ion-icon :icon="storefrontOutline" />
        <h3>Your next favorite store is coming</h3>
        <p>No stores are listed yet. Please check back soon.</p>
      </section>
      <template v-else>
        <StoreCard
          v-for="store in featuredStores"
          :key="store.id"
          :store="store"
          @select="openStore"
        />
        <ion-button expand="block" fill="outline" router-link="/tabs/stores">
          Browse all stores
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { arrowForwardOutline, locationOutline, pawOutline, storefrontOutline } from 'ionicons/icons';
import StoreCard from '@/components/StoreCard.vue';
import { listStores } from '@/services/storeService';
import type { Store } from '@/types';

const municipality = import.meta.env.VITE_MUNICIPALITY_NAME?.trim() ?? '';
const stores = ref<Store[]>([]);
const loading = ref(true);
const error = ref('');
const router = useRouter();

const featuredStores = computed(() => stores.value.slice(0, 3));

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
.welcome {
  position: relative;
  display: flex;
  min-height: 15rem;
  align-items: center;
  overflow: hidden;
  padding: 1.5rem;
  margin: 0.35rem 0 2rem;
  border-radius: 1.4rem;
  background: linear-gradient(115deg, #174f45, #257c66 62%, #46977d);
  color: white;
  box-shadow: 0 16px 32px rgb(23 79 69 / 18%);
}

.welcome-copy {
  position: relative;
  z-index: 1;
  max-width: 19rem;
}

.welcome .eyebrow {
  margin: 0;
  color: #c2e4d5;
  font-size: 0.68rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.welcome h1 {
  margin: 0.6rem 0;
  color: white;
  font-size: clamp(1.8rem, 8vw, 2.35rem);
  line-height: 1.06;
  letter-spacing: -0.045em;
}

.welcome p:not(.eyebrow) {
  max-width: 16rem;
  margin: 0 0 1rem;
  color: #e1f0e9;
  font-size: 0.9rem;
  line-height: 1.5;
}

.welcome ion-button {
  --background: #fff;
  --color: #185b4d;
  --border-radius: 0.75rem;
  margin: 0;
}

.hero-art {
  position: absolute;
  right: -1.25rem;
  bottom: -1.6rem;
  display: grid;
  width: 10.5rem;
  height: 10.5rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 50%;
  background: rgb(255 255 255 / 8%);
  color: rgb(255 255 255 / 22%);
  transform: rotate(-14deg);
}

.hero-art ion-icon {
  font-size: 7.5rem;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.section-heading h2 {
  margin: 0.25rem 0 0.4rem;
  font-size: 1.35rem;
  letter-spacing: -0.03em;
}

.section-heading .eyebrow {
  margin: 0;
  color: var(--ion-color-primary);
  font-size: 0.65rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.section-heading .location {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
}

.section-heading .location ion-icon {
  color: var(--ion-color-primary);
}

.section-heading ion-button {
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
}

.loading-state,
.empty-stores {
  display: grid;
  min-height: 10rem;
  place-items: center;
  align-content: center;
  text-align: center;
}

.empty-stores ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.5rem;
}

.empty-stores h3 {
  margin-bottom: 0.3rem;
}

.empty-stores p {
  margin-top: 0;
  color: var(--ion-color-medium);
}
</style>
