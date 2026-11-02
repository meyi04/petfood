<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Nearby stores</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <section class="nearby-heading">
        <div>
          <p class="eyebrow">VICTORIA, ORIENTAL MINDORO</p>
          <h1>Pet shops around you</h1>
          <p class="intro">
            Explore pet food shops and feed stores on the map, then get directions straight there.
          </p>
        </div>
        <ion-button
          fill="outline"
          class="location-button"
          :disabled="locating"
          @click="locate"
        >
          <ion-spinner v-if="locating" slot="start" name="crescent" />
          <ion-icon v-else slot="start" :icon="locateOutline" />
          {{ locating ? 'Locating' : location ? 'Update location' : 'Use my location' }}
        </ion-button>
      </section>

      <ion-note v-if="locationError" color="warning" class="location-note">
        {{ locationError }}
      </ion-note>
      <ion-note v-else-if="location" color="success" class="location-note">
        Showing distances from your current location.
      </ion-note>

      <section class="map-section" aria-label="Map of pet shops and pet food stores">
        <div class="map-heading">
          <div>
            <h2>Explore the area</h2>
            <p>{{ location ? 'Map centered on your current location' : 'Map centered on Victoria' }}</p>
          </div>
          <ion-button fill="clear" class="full-map-link" @click="fullMapOpen = true">
            Expand map
            <ion-icon slot="end" :icon="expandOutline" />
          </ion-button>
        </div>
        <div class="map-frame">
          <iframe
            :src="mapUrl"
            title="Interactive Google map showing nearby pet food shops and animal feed stores"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          />
        </div>
        <p class="map-attribution">
          Map listings are provided by Google Maps. Business hours and availability may change.
        </p>
      </section>

      <div v-if="!loading && !error" class="results-heading">
        <div>
          <h2>Stores in the directory</h2>
          <p>Public listings are for discovery; PetFood partners accept in-app orders.</p>
        </div>
        <span>{{ locatedStores.length }}</span>
      </div>
      <div v-if="loading" class="loading-state"><ion-spinner /></div>
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <section v-else-if="!stores.length" class="empty-state">
        <ion-icon :icon="storefrontOutline" />
        <h2>No PetFood partners yet</h2>
        <p>Use the map above to explore local businesses. Stores can join PetFood to list products and accept orders.</p>
        <ion-button router-link="/tabs/stores" fill="outline">Browse PetFood stores</ion-button>
      </section>
      <section v-else-if="!locatedStores.length" class="empty-state">
        <ion-icon :icon="locationOutline" />
        <h2>Store locations needed</h2>
        <p>PetFood partners haven’t added map coordinates yet. Their store details are still available in the directory.</p>
        <ion-button router-link="/tabs/stores" fill="outline">Browse all stores</ion-button>
      </section>
      <StoreCard
        v-for="entry in locatedStores"
        :key="entry.store.id"
        :store="entry.store"
        :distance-km="entry.distanceKm"
        @select="openStore"
      />
      <ion-button
        v-if="locatedStores.length && !loading && !error"
        expand="block"
        fill="clear"
        router-link="/tabs/stores"
      >
        Search all stores
      </ion-button>
    </ion-content>
    <ion-modal
      :is-open="fullMapOpen"
      class="full-map-modal"
      @did-dismiss="fullMapOpen = false"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Pet shops near {{ location ? 'you' : 'Victoria' }}</ion-title>
          <ion-button slot="end" fill="clear" aria-label="Close full map" @click="fullMapOpen = false">
            <ion-icon slot="icon-only" :icon="closeOutline" />
          </ion-button>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <iframe
          class="full-map-frame"
          :src="mapUrl"
          title="Expanded interactive map of pet food shops near Victoria, Oriental Mindoro"
          allowfullscreen
        />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  closeOutline,
  expandOutline,
  locateOutline,
  locationOutline,
  storefrontOutline,
} from 'ionicons/icons';
import StoreCard from '@/components/StoreCard.vue';
import { listStores } from '@/services/storeService';
import { distanceInKm } from '@/utils/distance';
import type { Store } from '@/types';

const router = useRouter();
const stores = ref<Store[]>([]);
const location = ref<{ lat: number; lng: number } | null>(null);
const loading = ref(true);
const locating = ref(false);
const fullMapOpen = ref(false);
const error = ref('');
const locationError = ref('');

const victoriaLocation = { lat: 13.1733849, lng: 121.2787746 };
const mapLocation = computed(() => location.value ?? victoriaLocation);
const mapUrl = computed(() => {
  const query = location.value
    ? `pet food store near ${location.value.lat},${location.value.lng}`
    : 'pet food store near Victoria, Oriental Mindoro, Philippines';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=13&output=embed`;
});

const locatedStores = computed(() => {
  const entries = stores.value.flatMap((store) => {
    const coordinates = { lat: store.lat, lng: store.lng };
    if (distanceInKm(coordinates, coordinates) === null) return [];
    return [{
      store,
      distanceKm: distanceInKm(mapLocation.value, coordinates),
    }];
  });
  return entries.sort((first, second) =>
    (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity),
  );
});

function openStore(store: Store): void {
  void router.push(`/stores/${store.id}`);
}

async function locate(): Promise<void> {
  locating.value = true;
  locationError.value = '';
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
    });
    location.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (cause) {
    locationError.value = cause instanceof Error
      ? `Location unavailable: ${cause.message}`
      : 'Location is unavailable. Check your device permissions and try again.';
  } finally {
    locating.value = false;
  }
}

onMounted(async () => {
  try {
    stores.value = await listStores();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load nearby stores.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.nearby-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.25rem 0 1rem;
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
  font-size: 1.8rem;
  letter-spacing: -0.045em;
}

.intro {
  max-width: 27rem;
  margin: 0.45rem 0 0;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.location-button {
  flex: none;
  margin-top: 0.2rem;
  font-size: 0.8rem;
}

.location-note {
  display: block;
  padding: 0.75rem 0.9rem;
  margin: 0.5rem 0 1rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.75rem;
  background: var(--ion-item-background);
  font-size: 0.82rem;
  line-height: 1.4;
}

.results-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.5rem 0 0.85rem;
}

.results-heading h2 {
  margin: 0;
  font-size: 1.1rem;
}

.results-heading p {
  margin: 0.3rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
  line-height: 1.45;
}

.results-heading span {
  flex: none;
  display: grid;
  min-width: 1.8rem;
  height: 1.8rem;
  place-items: center;
  border-radius: 999px;
  background: var(--ion-color-light);
  color: var(--ion-text-color);
  font-size: 0.8rem;
  font-weight: 700;
}

.map-section {
  margin: 1.25rem 0;
}

.map-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
}

.map-heading h2 {
  margin: 0;
  font-size: 1.1rem;
}

.map-heading p,
.map-attribution {
  margin: 0.25rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
  line-height: 1.45;
}

.full-map-link {
  display: inline-flex;
  flex: none;
  font-size: 0.8rem;
  margin: 0;
}

.map-frame {
  width: 100%;
  height: clamp(18rem, 58vw, 27rem);
  overflow: hidden;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-item-background);
  box-shadow: 0 8px 24px rgba(var(--ion-color-primary-rgb), 0.07);
}

.map-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}

.map-attribution {
  margin-top: 0.5rem;
}

.full-map-frame {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 100%;
  border: 0;
}

.full-map-modal {
  --height: 100%;
  --width: 100%;
  --border-radius: 0;
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
  max-width: 20rem;
  margin: 0 0 0.5rem;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

@media (max-width: 420px) {
  .nearby-heading {
    flex-direction: column;
  }

  .location-button {
    margin-top: 0;
  }

  .map-heading {
    align-items: flex-start;
  }
}
</style>
