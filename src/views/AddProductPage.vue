<!-- src/views/AddProductPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/products" /></ion-buttons>
        <ion-title>{{ editing ? 'Edit product' : 'Add product' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form class="page-form" @submit.prevent="save">
        <section class="image-upload">
          <p class="field-label">PRODUCT PHOTO</p>
          <button
            v-if="!Capacitor.isNativePlatform()"
            class="upload-dropzone"
            type="button"
            :disabled="uploading"
            @click="fileInput?.click()"
          >
            <img v-if="imageUrl" class="preview" :src="imageUrl" alt="Product image preview" />
            <template v-else>
              <ion-icon :icon="cloudUploadOutline" />
              <strong>{{ uploading ? 'Uploading image…' : 'Choose a product photo' }}</strong>
              <span>JPEG, PNG, or WebP · stored in Firestore as a compressed image</span>
            </template>
          </button>
          <div v-else class="native-image-picker">
            <img v-if="imageUrl" class="preview" :src="imageUrl" alt="Product image preview" />
            <ion-button type="button" fill="outline" :disabled="uploading" @click="uploadImage">
              <ion-icon slot="start" :icon="cloudUploadOutline" />
              {{ uploading ? 'Uploading…' : imageUrl ? 'Change photo' : 'Take / choose photo' }}
            </ion-button>
          </div>
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleImageSelected"
          />
        </section>
        <ion-input v-model="name" label="Product name" label-placement="stacked" required />
        <ion-input
          v-model.number="price"
          label="Price"
          label-placement="stacked"
          type="number"
          min="0.01"
          step="0.01"
          required
        />
        <ion-select v-model="category" label="Category" label-placement="stacked" interface="popover">
          <ion-select-option v-for="item in PRODUCT_CATEGORIES" :key="item" :value="item">
            {{ item }}
          </ion-select-option>
        </ion-select>
        <ion-textarea
          v-model="description"
          label="Description"
          label-placement="stacked"
          :auto-grow="true"
        />
        <ion-button expand="block" type="submit" :disabled="saving || uploading || loading">
          {{ saving ? 'Saving…' : editing ? 'Save changes' : 'Save product' }}
        </ion-button>
      </form>
      <ion-toast
        :is-open="Boolean(message)"
        :message="message"
        duration="4000"
        :color="messageColor"
        @did-dismiss="message = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { cloudUploadOutline } from 'ionicons/icons';
import { createProduct, getOwnerStore, getProduct, updateProduct } from '@/services/storeService';
import {
  captureImageForFirestore,
  encodeImageFileForFirestore,
} from '@/services/uploadService';
import { useAuthStore } from '@/stores/auth';
import { PRODUCT_CATEGORIES } from '@/types';

const name = ref('');
const price = ref<number | null>(null);
const category = ref<string>(PRODUCT_CATEGORIES[0]);
const description = ref('');
const imageUrl = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const editing = ref(Boolean(route.params.productId));

async function uploadImage(): Promise<void> {
  uploading.value = true;
  try {
    imageUrl.value = await captureImageForFirestore();
    messageColor.value = 'success';
    message.value = 'Product photo ready. Save the product to store it in Firestore.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not upload this image.';
  } finally {
    uploading.value = false;
  }
}

async function handleImageSelected(event: Event): Promise<void> {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  uploading.value = true;
  try {
    imageUrl.value = await encodeImageFileForFirestore(file);
    messageColor.value = 'success';
    message.value = 'Product photo ready. Save the product to store it in Firestore.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not upload this image.';
  } finally {
    uploading.value = false;
  }
}

async function save(): Promise<void> {
  if (price.value === null || !Number.isFinite(price.value) || price.value <= 0) {
    messageColor.value = 'danger';
    message.value = 'Enter a product price greater than zero.';
    return;
  }

  saving.value = true;
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again before saving this product.');
    const store = await getOwnerStore(ownerId);
    if (!store) throw new Error('Create your store profile before adding products.');
    const input = {
      name: name.value.trim(),
      price: price.value,
      description: description.value.trim(),
      category: category.value,
      imageUrl: imageUrl.value,
    };
    if (editing.value) {
      const productId = String(route.params.productId);
      const existing = await getProduct(productId);
      if (!existing || existing.storeId !== store.id) {
        throw new Error('This product does not belong to your store.');
      }
      await updateProduct(productId, input);
    } else {
      await createProduct(store.id, input);
    }
    await router.replace('/tabs/products');
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not save this product.';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (!editing.value) return;
  loading.value = true;
  try {
    const product = await getProduct(String(route.params.productId));
    if (!product) throw new Error('This product could not be found.');
    name.value = product.name;
    price.value = product.price;
    category.value = product.category;
    description.value = product.description;
    imageUrl.value = product.imageUrl;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not load this product.';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-form {
  display: grid;
  gap: 1rem;
  max-width: 38rem;
  margin: auto;
}

.image-upload {
  display: grid;
  gap: 0.5rem;
}

.field-label {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.upload-dropzone {
  display: grid;
  min-height: 11rem;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1rem;
  overflow: hidden;
  border: 1px dashed #91b8a9;
  border-radius: 1rem;
  background: #f2f7f4;
  color: var(--ion-color-primary);
  font: inherit;
  cursor: pointer;
}

.upload-dropzone > ion-icon {
  font-size: 2rem;
}

.upload-dropzone span {
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

.native-image-picker {
  display: grid;
  gap: 0.65rem;
  justify-items: start;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.preview {
  width: 100%;
  max-height: 15rem;
  object-fit: cover;
  border-radius: 0.8rem;
}
</style>
