<!-- src/components/ProductCard.vue -->
<template>
  <ion-card button @click="$emit('select', product)">
    <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
    <ion-card-header>
      <ion-card-subtitle>{{ product.category }}</ion-card-subtitle>
      <ion-card-title>{{ product.name }}</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <p>{{ product.description }}</p>
      <strong>{{ formatCurrency(product.price) }}</strong>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
} from '@ionic/vue';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';

defineProps<{ product: Product }>();
defineEmits<{ select: [product: Product] }>();
</script>
