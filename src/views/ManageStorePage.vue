<!-- src/views/ManageStorePage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button default-href="/tabs/owner" /></ion-buttons>
        <ion-title>Manage store</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-spinner v-if="loading" />
      <form v-else class="page-form" @submit.prevent="save">
        <ion-input v-model="form.name" label="Store name" label-placement="stacked" required />
        <ion-input v-model="form.address" label="Street address" label-placement="stacked" required />
        <ion-input
          v-model="form.municipality"
          label="Municipality"
          label-placement="stacked"
          autocomplete="address-level2"
          required
        />
        <ion-input v-model="form.phone" label="Contact phone" label-placement="stacked" type="tel" />
        <ion-button type="button" fill="outline" :disabled="locating" @click="locate">
          {{ locating ? 'Getting location…' : 'Use my current location' }}
        </ion-button>
        <p v-if="hasLocation">Coordinates: {{ form.lat.toFixed(5) }}, {{ form.lng.toFixed(5) }}</p>
        <section class="image-upload">
          <p class="field-label">STORE PHOTO</p>
          <div class="photo-preview" :class="{ 'has-photo': form.imageUrl }">
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="Current store photo" />
            <div v-else class="photo-placeholder">
              <ion-icon :icon="storefrontOutline" />
              <span>Add a photo to help buyers recognize your store</span>
            </div>
            <ion-button
              v-if="!Capacitor.isNativePlatform()"
              class="change-photo-button"
              type="button"
              fill="solid"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <ion-icon slot="start" :icon="cameraOutline" />
              {{ uploading ? 'Preparing photo…' : form.imageUrl ? 'Change photo' : 'Choose photo' }}
            </ion-button>
            <ion-button
              v-else
              class="change-photo-button"
              type="button"
              fill="solid"
              :disabled="uploading"
              @click="uploadStoreImage"
            >
              <ion-icon slot="start" :icon="cameraOutline" />
              {{ uploading ? 'Preparing photo…' : form.imageUrl ? 'Change photo' : 'Take / choose photo' }}
            </ion-button>
          </div>
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="handleImageSelected"
          />
          <p class="image-help">JPEG, PNG, or WebP · compressed and stored in Firestore</p>
        </section>
        <ion-button expand="block" type="submit" :disabled="saving || loading || uploading">
          {{ saving ? 'Saving…' : 'Save store profile' }}
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
import { onMounted, reactive, ref } from 'vue';
import { Geolocation } from '@capacitor/geolocation';
import { useRouter } from 'vue-router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import { cameraOutline, storefrontOutline } from 'ionicons/icons';
import { getOwnerStore, saveOwnerStore } from '@/services/storeService';
import {
  captureImageForFirestore,
  encodeImageFileForFirestore,
} from '@/services/uploadService';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const municipality = import.meta.env.VITE_MUNICIPALITY_NAME?.trim() ?? '';
const form = reactive({
  name: '',
  address: '',
  municipality,
  lat: 0,
  lng: 0,
  phone: '',
  imageUrl: '',
});
const hasLocation = ref(false);
const loading = ref(true);
const saving = ref(false);
const locating = ref(false);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const message = ref('');
const messageColor = ref<'success' | 'danger'>('success');

async function locate(): Promise<void> {
  locating.value = true;
  try {
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    form.lat = position.coords.latitude;
    form.lng = position.coords.longitude;
    hasLocation.value = true;
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not get your location.';
  } finally {
    locating.value = false;
  }
}

async function uploadStoreImage(): Promise<void> {
  uploading.value = true;
  try {
    form.imageUrl = await captureImageForFirestore();
    messageColor.value = 'success';
    message.value = 'Store photo ready. Save the profile to apply it.';
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
    form.imageUrl = await encodeImageFileForFirestore(file);
    messageColor.value = 'success';
    message.value = 'Store photo ready. Save the profile to apply it.';
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not prepare this photo.';
  } finally {
    uploading.value = false;
  }
}

async function save(): Promise<void> {
  const municipalityName = form.municipality.trim();
  if (!municipalityName) {
    messageColor.value = 'danger';
    message.value = 'Enter the municipality where your store is located.';
    return;
  }
  if (!hasLocation.value) {
    messageColor.value = 'danger';
    message.value = 'Add your store location before saving.';
    return;
  }
  const ownerId = authStore.profile?.uid;
  if (!ownerId) {
    messageColor.value = 'danger';
    message.value = 'Sign in again before saving the store.';
    return;
  }

  saving.value = true;
  try {
    await saveOwnerStore(ownerId, { ...form, municipality: municipalityName });
    messageColor.value = 'success';
    message.value = 'Store profile saved.';
    await router.replace('/tabs/owner');
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not save the store.';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    const ownerId = authStore.profile?.uid;
    if (!ownerId) throw new Error('Sign in again to manage your store.');
    const store = await getOwnerStore(ownerId);
    if (store) {
      form.name = store.name;
      form.address = store.address;
      form.municipality = store.municipality;
      form.lat = store.lat;
      form.lng = store.lng;
      form.phone = store.phone;
      form.imageUrl = store.imageUrl;
      hasLocation.value = Number.isFinite(store.lat) && Number.isFinite(store.lng);
    }
  } catch (cause) {
    messageColor.value = 'danger';
    message.value = cause instanceof Error ? cause.message : 'Could not load your store.';
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

.photo-preview {
  position: relative;
  display: grid;
  min-height: 13rem;
  place-items: center;
  overflow: hidden;
  border: 1px dashed #91b8a9;
  border-radius: 1rem;
  background: linear-gradient(135deg, #e8f3ee, #f5eee2);
}

.photo-preview.has-photo {
  border-style: solid;
  background: #e8eeeb;
}

.photo-preview > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  max-width: 17rem;
  padding: 1rem;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  text-align: center;
}

.photo-placeholder ion-icon {
  color: var(--ion-color-primary);
  font-size: 2.5rem;
}

.change-photo-button {
  position: absolute;
  z-index: 1;
  right: 0.75rem;
  bottom: 0.75rem;
  margin: 0;
  --background: white;
  --color: var(--ion-color-primary);
  --border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgb(35 51 45 / 16%);
}

.image-help {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.75rem;
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
</style>
