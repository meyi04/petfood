<!-- src/components/ProductCard.vue -->
<template>
  <ion-card button class="product-card" @click="$emit('select', product)">
    <div class="product-image">
      <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" loading="lazy" />
      <ion-icon v-else :icon="pawOutline" aria-hidden="true" />
    </div>
    <ion-card-content class="product-content">
      <div class="product-heading">
        <span class="product-category">{{ product.category }}</span>
        <ion-card-title>{{ product.name }}</ion-card-title>
      </div>
      <p class="product-description">{{ product.description }}</p>
      <strong class="product-price">{{ formatCurrency(product.price) }}</strong>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonCardTitle,
} from '@ionic/vue';
import { pawOutline } from 'ionicons/icons';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';

defineProps<{ product: Product }>();
defineEmits<{ select: [product: Product] }>();
</script>

<style scoped>
.product-card {
  overflow: hidden;
}

.product-image {
  display: grid;
  aspect-ratio: 16 / 10;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #f5e1d4, #f8edcf);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 240ms ease;
}

.product-card:hover .product-image img {
  transform: scale(1.035);
}

.product-image ion-icon {
  color: var(--ion-color-primary);
  font-size: 3rem;
  opacity: 0.72;
}

.product-content {
  display: grid;
  gap: 0.55rem;
  padding: 1rem 1.1rem 1.15rem;
}

.product-heading {
  display: grid;
  gap: 0.25rem;
}

.product-category {
  color: var(--ion-color-primary);
  font-size: 0.68rem;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.product-heading ion-card-title {
  font-size: 1.05rem;
  letter-spacing: -0.025em;
}

.product-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-price {
  color: var(--ion-color-primary);
  font-size: 1.1rem;
  font-weight: 800;
}
</style>
