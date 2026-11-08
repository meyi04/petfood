<!-- src/views/AddProductPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/products" /></ion-buttons>
        <ion-title>{{ editing ? 'Edit product' : 'Add a product' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="product-content">
      <main class="editor-shell">
        <header class="editor-heading">
          <div>
            <p class="eyebrow">{{ editing ? 'PRODUCT CATALOG' : 'GROW YOUR CATALOG' }}</p>
            <h1>{{ editing ? 'Update your product' : 'Add a new product' }}</h1>
            <p class="heading-copy">
              {{ editing
                ? 'Keep your listing accurate so customers know exactly what they are ordering.'
                : 'Give customers the details they need to find their next pet essential.' }}
            </p>
          </div>
          <span class="editor-step">
            <ion-icon :icon="pricetagOutline" />
            {{ editing ? 'Edit listing' : 'New listing' }}
          </span>
        </header>

        <form class="editor-layout" @submit.prevent="save">
          <div class="form-column">
            <section class="form-section photo-section">
              <div class="section-heading">
                <span class="section-icon"><ion-icon :icon="imageOutline" /></span>
                <div>
                  <h2>Product photo</h2>
                  <p>A clear photo helps your product stand out.</p>
                </div>
                <span class="optional-label">OPTIONAL</span>
              </div>

              <button
                v-if="!Capacitor.isNativePlatform()"
                class="upload-dropzone"
                :class="{ 'has-image': imageUrl }"
                type="button"
                :disabled="uploading"
                @click="fileInput?.click()"
              >
                <img v-if="imageUrl" class="preview" :src="imageUrl" alt="Product image preview" />
                <span v-if="imageUrl" class="change-photo">
                  <ion-icon :icon="cloudUploadOutline" />
                  {{ uploading ? 'Processing photo…' : 'Choose a different photo' }}
                </span>
                <template v-else>
                  <span class="upload-icon"><ion-icon :icon="cloudUploadOutline" /></span>
                  <strong>{{ uploading ? 'Processing your photo…' : 'Click to upload a photo' }}</strong>
                  <span class="upload-hint">JPEG, PNG, or WebP · up to 5 MB</span>
                </template>
              </button>
              <div v-else class="native-image-picker">
                <div class="native-preview">
                  <img v-if="imageUrl" class="preview" :src="imageUrl" alt="Product image preview" />
                  <span v-else class="upload-icon"><ion-icon :icon="imageOutline" /></span>
                  <span v-if="!imageUrl">Your product photo preview will appear here</span>
                </div>
                <ion-button type="button" fill="outline" :disabled="uploading" @click="uploadImage">
                  <ion-icon slot="start" :icon="cloudUploadOutline" />
                  {{ uploading ? 'Processing…' : imageUrl ? 'Change photo' : 'Take or choose photo' }}
                </ion-button>
                <ion-note>JPEG, PNG, or WebP · up to 5 MB</ion-note>
              </div>
              <input
                ref="fileInput"
                class="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                @change="handleImageSelected"
              />
            </section>

            <section class="form-section details-section">
              <div class="section-heading">
                <span class="section-icon"><ion-icon :icon="documentTextOutline" /></span>
                <div>
                  <h2>Product details</h2>
                  <p>Make the important information easy to understand.</p>
                </div>
              </div>

              <div class="field-grid">
                <ion-input
                  v-model="name"
                  class="form-control name-control"
                  label="Product name"
                  label-placement="stacked"
                  placeholder="e.g. Premium Adult Dog Food"
                  :maxlength="100"
                  required
                />
                <ion-select
                  v-model="category"
                  class="form-control category-control"
                  label="Category"
                  label-placement="stacked"
                  interface="popover"
                >
                  <ion-select-option v-for="item in PRODUCT_CATEGORIES" :key="item" :value="item">
                    {{ item }}
                  </ion-select-option>
                </ion-select>
                <ion-textarea
                  v-model="description"
                  class="form-control description-control"
                  label="Description"
                  label-placement="stacked"
                  placeholder="Share what makes this product a great choice for pets..."
                  :auto-grow="true"
                  :maxlength="500"
                  :counter="true"
                />
              </div>
            </section>

            <section class="form-section price-section">
              <div class="section-heading">
                <span class="section-icon price-icon"><ion-icon :icon="pricetagOutline" /></span>
                <div>
                  <h2>Pricing</h2>
                  <p>Set the price customers will see in your shop.</p>
                </div>
              </div>
              <ion-input
                v-model.number="price"
                class="form-control price-control"
                label="Selling price"
                label-placement="stacked"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
              <p class="price-hint">Enter a price greater than zero.</p>
            </section>

            <div class="form-actions">
              <ion-button
                class="save-button"
                expand="block"
                type="submit"
                :disabled="saving || uploading || loading"
              >
                <ion-spinner v-if="saving" slot="start" name="crescent" />
                <ion-icon v-else slot="start" :icon="checkmarkOutline" />
                {{ saving ? 'Saving product…' : editing ? 'Save changes' : 'Add product to shop' }}
              </ion-button>
              <p>Changes will be visible to customers in your shop.</p>
            </div>
          </div>

          <aside class="preview-column">
            <section class="preview-panel">
              <div class="preview-heading">
                <div>
                  <p class="eyebrow">CUSTOMER VIEW</p>
                  <h2>Listing preview</h2>
                </div>
                <ion-icon :icon="eyeOutline" />
              </div>
              <article class="product-preview-card">
                <div class="product-preview-image">
                  <img v-if="imageUrl" :src="imageUrl" :alt="name || 'Product preview'" />
                  <ion-icon v-else :icon="pawOutline" />
                  <span class="preview-badge">{{ category }}</span>
                </div>
                <div class="product-preview-copy">
                  <span class="store-label">YOUR SHOP</span>
                  <h3>{{ name.trim() || 'Your product name' }}</h3>
                  <p>{{ description.trim() || 'A short description of your product will appear here.' }}</p>
                  <strong>{{ formatCurrency(price && price > 0 ? price : 0) }}</strong>
                </div>
              </article>
              <div class="preview-tip">
                <ion-icon :icon="sparklesOutline" />
                <p>Listings with a clear photo and helpful description are easier for customers to shop.</p>
              </div>
            </section>
          </aside>
        </form>
      </main>
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
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import {
  checkmarkOutline,
  cloudUploadOutline,
  documentTextOutline,
  eyeOutline,
  imageOutline,
  pawOutline,
  pricetagOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { createProduct, getOwnerStore, getProduct, updateProduct } from '@/services/storeService';
import {
  captureImageForFirestore,
  encodeImageFileForFirestore,
} from '@/services/uploadService';
import { useAuthStore } from '@/stores/auth';
import { PRODUCT_CATEGORIES } from '@/types';
import { formatCurrency } from '@/utils/format';

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
.product-content {
  --background: var(--app-surface-muted);
}

.editor-shell {
  width: min(100%, 70rem);
  margin: 0 auto;
  padding: clamp(0.5rem, 2vw, 1.5rem) 0 2rem;
}

.editor-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.35rem 0 1.6rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--ion-color-primary);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.11em;
}

.editor-heading h1 {
  margin: 0;
  font-size: clamp(1.65rem, 5vw, 2.2rem);
  font-weight: 780;
  letter-spacing: -0.05em;
}

.heading-copy {
  max-width: 38rem;
  margin: 0.5rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  line-height: 1.55;
}

.editor-step {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 999px;
  background: var(--ion-card-background);
  color: var(--ion-color-primary);
  font-size: 0.72rem;
  font-weight: 700;
}

.editor-step ion-icon {
  font-size: 0.95rem;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
}

.form-column {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.form-section,
.preview-panel {
  padding: clamp(1rem, 3vw, 1.4rem);
  border: 1px solid var(--ion-border-color);
  border-radius: 1.05rem;
  background: var(--ion-card-background);
  box-shadow: var(--app-shadow-soft);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.1rem;
}

.section-heading > div {
  flex: 1;
  min-width: 0;
}

.section-heading h2,
.preview-heading h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.section-heading p {
  margin: 0.22rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.76rem;
  line-height: 1.4;
}

.section-icon {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  flex: none;
  place-items: center;
  border-radius: 0.75rem;
  background: rgba(var(--ion-color-primary-rgb), 0.09);
  color: var(--ion-color-primary);
  font-size: 1.15rem;
}

.optional-label {
  flex: none;
  color: var(--ion-color-medium);
  font-size: 0.58rem;
  font-weight: 750;
  letter-spacing: 0.07em;
}

.upload-dropzone {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 12rem;
  place-items: center;
  align-content: center;
  gap: 0.55rem;
  padding: 1.25rem;
  overflow: hidden;
  border: 1px dashed rgba(var(--ion-color-primary-rgb), 0.42);
  border-radius: 0.9rem;
  background: var(--app-surface-muted);
  color: var(--ion-text-color);
  font: inherit;
  text-align: center;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease;
}

.upload-dropzone:hover,
.upload-dropzone:focus-visible {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.06);
  outline: none;
}

.upload-dropzone:disabled {
  cursor: wait;
  opacity: 0.72;
}

.upload-dropzone.has-image {
  min-height: 14rem;
  padding: 0;
  border-style: solid;
}

.upload-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 1rem;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary);
  font-size: 1.45rem;
}

.upload-dropzone > strong {
  font-size: 0.88rem;
}

.upload-hint {
  color: var(--ion-color-medium);
  font-size: 0.72rem;
}

.preview {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 12rem;
  max-height: 18rem;
  object-fit: cover;
}

.change-photo {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 0.65rem;
  background: rgba(15, 25, 38, 0.8);
  color: white;
  font-size: 0.72rem;
  font-weight: 650;
}

.native-image-picker {
  display: grid;
  justify-items: start;
  gap: 0.65rem;
}

.native-preview {
  display: grid;
  width: 100%;
  min-height: 10rem;
  place-items: center;
  align-content: center;
  gap: 0.6rem;
  overflow: hidden;
  border: 1px dashed rgba(var(--ion-color-primary-rgb), 0.42);
  border-radius: 0.9rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-medium);
  font-size: 0.76rem;
  text-align: center;
}

.native-preview .preview {
  max-height: 16rem;
}

.native-image-picker ion-note,
.price-hint {
  color: var(--ion-color-medium);
  font-size: 0.7rem;
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.9rem;
}

.form-control {
  --background: var(--ion-background-color);
  --border-color: var(--ion-border-color);
  --border-radius: 0.75rem;
  --highlight-color-focused: var(--ion-color-primary);
  --padding-start: 0.85rem;
  --padding-end: 0.85rem;
  --padding-top: 0.8rem;
  --padding-bottom: 0.8rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.75rem;
  font-size: 0.86rem;
}

.form-control::part(label) {
  margin-bottom: 0.45rem;
  color: var(--ion-text-color);
  font-size: 0.78rem;
  font-weight: 680;
}

.form-control::part(native) {
  --placeholder-color: var(--ion-color-medium);
  --placeholder-opacity: 0.75;
}

.description-control {
  min-height: 7rem;
}

.price-control {
  max-width: 18rem;
  font-weight: 650;
}

.price-hint {
  margin: 0.45rem 0 0;
}

.form-actions {
  padding: 0.25rem 0.1rem;
}

.save-button {
  min-height: 3.15rem;
  margin: 0;
  --border-radius: 0.8rem;
  font-weight: 720;
  letter-spacing: 0.005em;
}

.form-actions > p {
  margin: 0.6rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.7rem;
  text-align: center;
}

.preview-column {
  display: none;
}

.preview-panel {
  position: sticky;
  top: 1rem;
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.preview-heading .eyebrow {
  margin-bottom: 0.25rem;
  font-size: 0.57rem;
}

.preview-heading h2 {
  font-size: 0.95rem;
}

.preview-heading > ion-icon {
  color: var(--ion-color-medium);
  font-size: 1.2rem;
}

.product-preview-card {
  overflow: hidden;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.9rem;
  background: var(--ion-card-background);
}

.product-preview-image {
  position: relative;
  display: grid;
  aspect-ratio: 4 / 3;
  place-items: center;
  overflow: hidden;
  background: var(--app-surface-muted);
}

.product-preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-preview-image > ion-icon {
  color: var(--ion-color-primary);
  font-size: 3rem;
  opacity: 0.65;
}

.preview-badge {
  position: absolute;
  top: 0.7rem;
  left: 0.7rem;
  max-width: calc(100% - 1.4rem);
  overflow: hidden;
  padding: 0.35rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #233450;
  font-size: 0.62rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-preview-copy {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
}

.store-label {
  color: var(--ion-color-primary);
  font-size: 0.57rem;
  font-weight: 780;
  letter-spacing: 0.08em;
}

.product-preview-copy h3 {
  margin: 0;
  font-size: 1.02rem;
  letter-spacing: -0.025em;
  overflow-wrap: anywhere;
}

.product-preview-copy p {
  display: -webkit-box;
  overflow: hidden;
  min-height: 2.6rem;
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.77rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-preview-copy > strong {
  margin-top: 0.2rem;
  color: var(--ion-color-primary);
  font-size: 1.08rem;
}

.preview-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 0.9rem;
  padding: 0.75rem;
  border-radius: 0.7rem;
  background: rgba(var(--ion-color-primary-rgb), 0.07);
  color: var(--ion-color-primary);
}

.preview-tip ion-icon {
  flex: none;
  margin-top: 0.08rem;
}

.preview-tip p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.7rem;
  line-height: 1.45;
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

@media (min-width: 600px) {
  .field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .name-control {
    grid-column: 1 / -1;
  }

  .description-control {
    grid-column: 1 / -1;
  }
}

@media (min-width: 960px) {
  .editor-layout {
    grid-template-columns: minmax(0, 1.55fr) minmax(17rem, 0.8fr);
    gap: 1.25rem;
  }

  .preview-column {
    display: block;
  }
}

@media (max-width: 420px) {
  .editor-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .editor-step {
    align-self: flex-start;
  }
}
</style>
