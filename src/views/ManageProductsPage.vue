<!-- src/views/ManageProductsPage.vue -->
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Manage products</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <ion-button router-link="/tabs/products/new">Add product</ion-button>
      <ion-spinner v-if="loading" />
      <ion-text v-else-if="error" color="danger"><p>{{ error }}</p></ion-text>
      <ion-text v-else-if="!products.length"><p>No products added yet.</p></ion-text>
      <ion-card v-for="product in products" :key="product.id">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
        <ion-card-header>
          <ion-card-subtitle>{{ product.category }}</ion-card-subtitle>
          <ion-card-title>{{ product.name }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>{{ formatCurrency(product.price) }} · {{ product.description }}</p>
          <ion-button fill="outline" :router-link="`/tabs/products/${product.id}/edit`">
            Edit
          </ion-button>
          <ion-button color="danger" fill="outline" @click="remove(product)">Delete</ion-button>
        </ion-card-content>
      </ion-card>
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
import { onMounted, ref } from 'vue';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { deleteProduct, getOwnerStore, listProducts } from '@/services/storeService';
import { useAuthStore } from '@/stores/auth';
import { formatCurrency } from '@/utils/format';
import type { Product } from '@/types';

const authStore = useAuthStore();
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref('');
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');

async function remove(product: Product): Promise<void> {
  if (!window.confirm(`Delete "${product.name}"?`)) return;
  try {
    await deleteProduct(product.id);
    products.value = products.value.filter((item) => item.id !== product.id);
    messageColor.value = 'success';
    message.value = 'Product deleted.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not delete this product.';
  }
}

onMounted(async () => {
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to manage products.');
    const store = await getOwnerStore(ownerId);
    if (!store) throw new Error('Create your store profile before adding products.');
    products.value = await listProducts(store.id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Could not load products.';
  } finally {
    loading.value = false;
  }
});
</script>
