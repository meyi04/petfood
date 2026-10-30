<!-- src/components/StoreCard.vue -->
<template>
  <ion-card button class="store-card" @click="$emit('select', store)">
    <div class="store-cover">
      <img v-if="store.imageUrl" :src="store.imageUrl" :alt="store.name" />
      <ion-icon v-else :icon="storefrontOutline" aria-hidden="true" />
      <span class="cover-label">{{ store.directoryOnly ? 'LOCAL LISTING' : 'PETFOOD PARTNER' }}</span>
    </div>
    <ion-card-content class="store-content">
      <div class="store-heading">
        <div>
          <ion-card-title>{{ store.name }}</ion-card-title>
          <ion-card-subtitle>
            <ion-icon :icon="locationOutline" />
            {{ store.municipality }}
          </ion-card-subtitle>
        </div>
        <ion-icon class="open-icon" :icon="arrowForwardOutline" aria-hidden="true" />
      </div>
      <p class="store-address">{{ store.address }}</p>
      <div v-if="distanceKm !== undefined && distanceKm !== null" class="store-meta">
        <span class="store-distance">
          <ion-icon :icon="navigateOutline" />
          {{ distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m away` : `${distanceKm.toFixed(1)} km away` }}
        </span>
        <a
          class="directions-link"
          :href="directionsUrl"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`Get directions to ${store.name}`"
          @click.stop
        >
          Directions
        </a>
      </div>
      <a
        v-if="store.phone"
        class="store-phone"
        :href="`tel:${store.phone}`"
        @click.stop
      >
        <ion-icon :icon="callOutline" />
        {{ store.phone }}
      </a>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardSubtitle,
  IonCardTitle,
} from '@ionic/vue';
import {
  arrowForwardOutline,
  callOutline,
  locationOutline,
  navigateOutline,
  storefrontOutline,
} from 'ionicons/icons';
import type { Store } from '@/types';

const props = defineProps<{ store: Store; distanceKm?: number | null }>();
defineEmits<{ select: [store: Store] }>();

const directionsUrl = computed(() =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${props.store.lat},${props.store.lng}`)}`,
);
</script>

<style scoped>
.store-card {
  overflow: hidden;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.store-card:active {
  transform: scale(0.985);
}

.store-cover {
  position: relative;
  display: grid;
  height: 9rem;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #f5e1d4, #f8edcf);
}

.store-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-cover > ion-icon {
  color: #b95030;
  font-size: 3.5rem;
  opacity: 0.82;
}

.cover-label {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid rgb(255 255 255 / 50%);
  border-radius: 999px;
  background: rgb(255 255 255 / 86%);
  color: #7e3c28;
  font-size: 0.62rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.store-content {
  padding: 1rem 1.1rem 1.1rem;
}

.store-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.store-heading ion-card-title {
  font-size: 1.05rem;
  font-weight: 700;
}

.store-heading ion-card-subtitle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.4rem;
  color: var(--ion-color-medium);
}

.store-heading ion-card-subtitle ion-icon,
.store-phone ion-icon {
  font-size: 0.95rem;
}

.open-icon {
  flex: none;
  color: var(--ion-color-primary);
  font-size: 1.15rem;
}

.store-address {
  margin: 0.8rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  line-height: 1.45;
}

.store-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.7rem;
  font-size: 0.84rem;
}

.store-distance {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--ion-color-success);
  font-weight: 650;
}

.directions-link {
  color: var(--ion-color-primary);
  font-weight: 650;
  text-decoration: none;
}

.store-phone {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.7rem;
  color: var(--ion-color-primary);
  font-size: 0.88rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
