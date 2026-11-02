<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Account</ion-title>
        <ion-buttons slot="end"><ThemeToggleButton /></ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <section class="profile-heading">
        <ion-avatar>
          <ion-icon :icon="personCircleOutline" />
        </ion-avatar>
        <div class="profile-copy">
          <p class="eyebrow">YOUR ACCOUNT</p>
          <h1>{{ authStore.profile?.displayName || 'Pet parent' }}</h1>
          <p>{{ authStore.profile?.email || 'Your buyer profile' }}</p>
        </div>
      </section>

      <p class="section-label">PERSONAL DETAILS</p>
      <ion-list inset>
        <ion-item>
          <ion-icon slot="start" :icon="mailOutline" />
          <ion-label>
            <p>Email</p>
            <h2>{{ authStore.profile?.email || 'Not available' }}</h2>
          </ion-label>
        </ion-item>
        <ion-item>
          <ion-icon slot="start" :icon="ribbonOutline" />
          <ion-label>
            <p>Account type</p>
            <h2>Buyer</h2>
          </ion-label>
          <ion-chip color="success">Active</ion-chip>
        </ion-item>
      </ion-list>

      <div class="address-section-heading">
        <div>
          <p class="section-label">DELIVERY ADDRESSES</p>
          <p class="address-intro">Save where you’d like your pet essentials delivered.</p>
        </div>
        <ion-button size="small" @click="openNewAddress">
          <ion-icon slot="start" :icon="addOutline" />
          Add
        </ion-button>
      </div>

      <div v-if="addressesLoading" class="address-loading"><ion-spinner name="crescent" /></div>
      <ion-text v-else-if="addressError" color="danger">
        <p class="address-error">{{ addressError }}</p>
      </ion-text>
      <section v-else-if="!addresses.length" class="address-empty">
        <ion-icon :icon="locationOutline" />
        <h2>No delivery address saved</h2>
        <p>Add your address to make checkout quicker.</p>
        <ion-button fill="outline" @click="openNewAddress">Add a delivery address</ion-button>
      </section>
      <ion-card v-for="address in addresses" :key="address.id" class="address-card">
        <ion-card-content>
          <div class="address-card-heading">
            <div class="address-title">
              <span class="address-icon"><ion-icon :icon="locationOutline" /></span>
              <div>
                <h2>{{ address.label }}</h2>
                <ion-chip v-if="address.isDefault" color="success">Default</ion-chip>
              </div>
            </div>
            <ion-button
              fill="clear"
              size="small"
              :aria-label="`Edit ${address.label} address`"
              @click="openEditAddress(address)"
            >
              <ion-icon slot="icon-only" :icon="createOutline" />
            </ion-button>
          </div>
          <p class="recipient">{{ address.recipientName }} · {{ address.phone }}</p>
          <p class="address-details">{{ formatDeliveryAddress(address) }}</p>
          <p v-if="address.deliveryInstructions" class="delivery-instructions">
            Delivery note: {{ address.deliveryInstructions }}
          </p>
          <div class="address-actions">
            <ion-button
              v-if="!address.isDefault"
              fill="outline"
              size="small"
              :disabled="addressBusy"
              @click="makeDefault(address)"
            >
              Set as default
            </ion-button>
            <ion-button
              fill="clear"
              color="danger"
              size="small"
              :disabled="addressBusy"
              @click="removeAddress(address)"
            >
              <ion-icon slot="start" :icon="trashOutline" />
              Delete
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <p class="section-label">QUICK LINKS</p>
      <ion-list inset>
        <ion-item button router-link="/tabs/stores">
          <ion-icon slot="start" :icon="searchOutline" />
          <ion-label>Find a pet food store</ion-label>
          <ion-icon slot="end" :icon="chevronForwardOutline" />
        </ion-item>
        <ion-item button router-link="/tabs/orders">
          <ion-icon slot="start" :icon="receiptOutline" />
          <ion-label>Track my orders</ion-label>
          <ion-icon slot="end" :icon="chevronForwardOutline" />
        </ion-item>
      </ion-list>

      <div class="account-tip">
        <ion-icon :icon="pawOutline" />
        <p>Thanks for choosing local. Every order helps support the stores that care for your pets.</p>
      </div>

      <ion-modal
        :is-open="addressModalOpen"
        @did-dismiss="closeAddressModal"
      >
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button :disabled="addressSaving" @click="closeAddressModal">Cancel</ion-button>
            </ion-buttons>
            <ion-title>{{ editingAddressId ? 'Edit address' : 'Add address' }}</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <form class="address-form" @submit.prevent="saveAddress">
            <p class="address-form-intro">
              Enter the recipient and delivery location for your orders.
            </p>
            <ion-input
              v-model="addressForm.label"
              label="Address label"
              label-placement="stacked"
              placeholder="Home, Work, etc."
              :maxlength="32"
              required
            />
            <ion-input
              v-model="addressForm.recipientName"
              label="Recipient name"
              label-placement="stacked"
              autocomplete="name"
              :maxlength="100"
              required
            />
            <ion-input
              v-model="addressForm.phone"
              label="Contact number"
              label-placement="stacked"
              type="tel"
              autocomplete="tel"
              :maxlength="32"
              required
            />
            <ion-input
              v-model="addressForm.streetAddress"
              label="House no. and street"
              label-placement="stacked"
              autocomplete="street-address"
              :maxlength="200"
              required
            />
            <ion-input
              v-model="addressForm.barangay"
              label="Barangay"
              label-placement="stacked"
              :maxlength="100"
              required
            />
            <ion-input
              v-model="addressForm.municipality"
              label="City or municipality"
              label-placement="stacked"
              autocomplete="address-level2"
              :maxlength="100"
              required
            />
            <ion-input
              v-model="addressForm.province"
              label="Province"
              label-placement="stacked"
              autocomplete="address-level1"
              :maxlength="100"
              required
            />
            <ion-input
              v-model="addressForm.postalCode"
              label="Postal code (optional)"
              label-placement="stacked"
              autocomplete="postal-code"
              :maxlength="16"
            />
            <ion-textarea
              v-model="addressForm.deliveryInstructions"
              label="Delivery instructions (optional)"
              label-placement="stacked"
              auto-grow
              :maxlength="300"
            />
            <ion-item class="default-address-toggle">
              <ion-label>
                <h2>Set as default</h2>
                <p>Use this address automatically at checkout.</p>
              </ion-label>
              <ion-toggle v-model="addressForm.isDefault" slot="end" />
            </ion-item>
            <ion-text v-if="addressFormError" color="danger">
              <p>{{ addressFormError }}</p>
            </ion-text>
            <ion-button expand="block" type="submit" :disabled="addressSaving">
              <ion-spinner v-if="addressSaving" slot="start" name="crescent" />
              {{ addressSaving ? 'Saving address…' : editingAddressId ? 'Save changes' : 'Save address' }}
            </ion-button>
          </form>
        </ion-content>
      </ion-modal>

      <ion-toast
        :is-open="Boolean(addressMessage)"
        :message="addressMessage"
        duration="3500"
        :color="addressMessageColor"
        @did-dismiss="addressMessage = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  IonButton,
  IonAvatar,
  IonChip,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonToast,
  IonToggle,
  IonTitle,
  IonToolbar,
  IonText,
  IonButtons,
} from '@ionic/vue';
import {
  addOutline,
  chevronForwardOutline,
  createOutline,
  locationOutline,
  mailOutline,
  pawOutline,
  personCircleOutline,
  receiptOutline,
  ribbonOutline,
  searchOutline,
  trashOutline,
} from 'ionicons/icons';
import ThemeToggleButton from '@/components/ThemeToggleButton.vue';
import {
  createDeliveryAddress,
  deleteDeliveryAddress,
  formatDeliveryAddress,
  listDeliveryAddresses,
  updateDeliveryAddress,
  type DeliveryAddressInput,
} from '@/services/addressService';
import { useAuthStore } from '@/stores/auth';
import type { DeliveryAddress } from '@/types';

const authStore = useAuthStore();
const addresses = ref<DeliveryAddress[]>([]);
const addressesLoading = ref(true);
const addressError = ref('');
const addressSaving = ref(false);
const addressBusy = ref(false);
const addressModalOpen = ref(false);
const editingAddressId = ref('');
const addressFormError = ref('');
const addressMessage = ref('');
const addressMessageColor = ref<'success' | 'danger'>('success');
const emptyAddressForm = (): DeliveryAddressInput => ({
  label: '',
  recipientName: authStore.profile?.displayName ?? '',
  phone: '',
  streetAddress: '',
  barangay: '',
  municipality: '',
  province: 'Oriental Mindoro',
  postalCode: '',
  deliveryInstructions: '',
  isDefault: addresses.value.length === 0,
});
const addressForm = reactive<DeliveryAddressInput>(emptyAddressForm());

function openNewAddress(): void {
  editingAddressId.value = '';
  Object.assign(addressForm, emptyAddressForm());
  addressFormError.value = '';
  addressModalOpen.value = true;
}

function openEditAddress(address: DeliveryAddress): void {
  editingAddressId.value = address.id;
  Object.assign(addressForm, {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    streetAddress: address.streetAddress,
    barangay: address.barangay,
    municipality: address.municipality,
    province: address.province,
    postalCode: address.postalCode,
    deliveryInstructions: address.deliveryInstructions,
    isDefault: address.isDefault,
  });
  addressFormError.value = '';
  addressModalOpen.value = true;
}

function closeAddressModal(): void {
  if (addressSaving.value) return;
  addressModalOpen.value = false;
}

function showAddressError(cause: unknown, fallback: string): void {
  const reason = cause instanceof Error ? cause.message : fallback;
  addressError.value = reason;
  addressMessageColor.value = 'danger';
  addressMessage.value = reason;
}

async function refreshAddresses(): Promise<void> {
  const userId = authStore.profile?.uid;
  if (!userId) {
    addressError.value = 'Sign in again to manage your delivery addresses.';
    addressesLoading.value = false;
    return;
  }
  addressesLoading.value = true;
  addressError.value = '';
  try {
    addresses.value = await listDeliveryAddresses(userId);
  } catch (cause) {
    showAddressError(cause, 'Could not load your delivery addresses.');
  } finally {
    addressesLoading.value = false;
  }
}

async function saveAddress(): Promise<void> {
  const userId = authStore.profile?.uid;
  if (!userId) {
    addressFormError.value = 'Sign in again to save a delivery address.';
    return;
  }

  addressSaving.value = true;
  addressFormError.value = '';
  try {
    const input: DeliveryAddressInput = {
      label: addressForm.label.trim(),
      recipientName: addressForm.recipientName.trim(),
      phone: addressForm.phone.trim(),
      streetAddress: addressForm.streetAddress.trim(),
      barangay: addressForm.barangay.trim(),
      municipality: addressForm.municipality.trim(),
      province: addressForm.province.trim(),
      postalCode: addressForm.postalCode.trim(),
      deliveryInstructions: addressForm.deliveryInstructions.trim(),
      isDefault: addressForm.isDefault,
    };
    if (editingAddressId.value) {
      await updateDeliveryAddress(userId, editingAddressId.value, input);
    } else {
      await createDeliveryAddress(userId, input);
    }
    await refreshAddresses();
    addressModalOpen.value = false;
    addressMessageColor.value = 'success';
    addressMessage.value = editingAddressId.value ? 'Address updated.' : 'Address saved.';
  } catch (cause) {
    addressFormError.value = cause instanceof Error ? cause.message : 'Could not save this address.';
  } finally {
    addressSaving.value = false;
  }
}

async function makeDefault(address: DeliveryAddress): Promise<void> {
  const userId = authStore.profile?.uid;
  if (!userId) return;
  addressBusy.value = true;
  try {
    await updateDeliveryAddress(userId, address.id, {
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      streetAddress: address.streetAddress,
      barangay: address.barangay,
      municipality: address.municipality,
      province: address.province,
      postalCode: address.postalCode,
      deliveryInstructions: address.deliveryInstructions,
      isDefault: true,
    });
    await refreshAddresses();
    addressMessageColor.value = 'success';
    addressMessage.value = `${address.label} is now your default address.`;
  } catch (cause) {
    showAddressError(cause, 'Could not update your default address.');
  } finally {
    addressBusy.value = false;
  }
}

async function removeAddress(address: DeliveryAddress): Promise<void> {
  if (!window.confirm(`Delete your "${address.label}" delivery address?`)) return;
  const userId = authStore.profile?.uid;
  if (!userId) return;
  addressBusy.value = true;
  try {
    await deleteDeliveryAddress(userId, address.id);
    await refreshAddresses();
    addressMessageColor.value = 'success';
    addressMessage.value = 'Address deleted.';
  } catch (cause) {
    showAddressError(cause, 'Could not delete this address.');
  } finally {
    addressBusy.value = false;
  }
}

onMounted(refreshAddresses);
</script>

<style scoped>
.profile-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin: 0.35rem 0 1.6rem;
  border: 1px solid rgba(var(--ion-color-secondary-rgb), 0.14);
  border-radius: 1.15rem;
  background: linear-gradient(135deg, var(--ion-color-light), #e4f6f3);
}

.profile-heading ion-avatar {
  flex: none;
  width: 4rem;
  height: 4rem;
  padding: 0.65rem;
  border: 2px solid var(--ion-card-background);
  background: var(--ion-card-background);
  color: var(--ion-color-primary);
  box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.08);
}

.profile-heading ion-icon {
  width: 100%;
  height: 100%;
}

.profile-copy {
  min-width: 0;
}

.profile-copy .eyebrow,
.section-label {
  margin: 0 0 0.3rem;
  color: var(--ion-color-primary);
  font-size: 0.64rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.profile-copy h1 {
  overflow-wrap: anywhere;
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.035em;
}

.profile-copy p:last-child {
  overflow-wrap: anywhere;
  margin: 0.25rem 0 0;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.section-label {
  margin: 1.35rem 0 0.55rem 0.75rem;
}

.address-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.address-section-heading .section-label {
  margin: 0 0 0.3rem 0.75rem;
}

.address-intro {
  margin: 0 0 0 0.75rem;
  color: var(--ion-color-medium);
  font-size: 0.82rem;
  line-height: 1.4;
}

.address-loading {
  display: grid;
  min-height: 8rem;
  place-items: center;
  color: var(--ion-color-primary);
}

.address-error {
  padding: 0.85rem;
  border: 1px solid var(--ion-color-danger);
  border-radius: 0.75rem;
  background: var(--ion-card-background);
}

.address-empty {
  display: grid;
  justify-items: center;
  padding: 1.5rem 1rem;
  margin-top: 0.75rem;
  border: 1px dashed var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
  text-align: center;
}

.address-empty > ion-icon {
  color: var(--ion-color-primary);
  font-size: 2rem;
}

.address-empty h2 {
  margin: 0.6rem 0 0;
  font-size: 1rem;
}

.address-empty p {
  margin: 0.35rem 0 0.75rem;
  color: var(--ion-color-medium);
  font-size: 0.84rem;
}

.address-card {
  margin: 0.75rem 0 0;
}

.address-card ion-card-content {
  padding: 1rem;
}

.address-card-heading,
.address-title,
.address-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.address-title {
  justify-content: flex-start;
  min-width: 0;
}

.address-title > div {
  min-width: 0;
}

.address-title h2 {
  margin: 0;
  font-size: 1rem;
}

.address-icon {
  display: grid;
  flex: none;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 0.75rem;
  background: var(--app-surface-muted);
  color: var(--ion-color-primary);
  font-size: 1.2rem;
}

.address-title ion-chip {
  margin: 0.25rem 0 0;
  min-height: 1.35rem;
  font-size: 0.66rem;
}

.recipient {
  margin: 0.8rem 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.address-details,
.delivery-instructions {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  line-height: 1.5;
}

.delivery-instructions {
  margin-top: 0.45rem;
  font-size: 0.8rem;
}

.address-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.address-form {
  display: grid;
  gap: 0.9rem;
  max-width: 38rem;
  margin: 0 auto;
}

.address-form-intro {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.88rem;
  line-height: 1.5;
}

.default-address-toggle {
  --background: var(--app-surface-muted);
  --border-radius: 0.85rem;
  --inner-padding-end: 0.8rem;
  --padding-start: 0.85rem;
  border: 1px solid var(--ion-border-color);
  border-radius: 0.85rem;
}

.default-address-toggle h2 {
  font-size: 0.9rem;
}

.default-address-toggle p {
  margin-top: 0.25rem;
  color: var(--ion-color-medium);
  font-size: 0.78rem;
}

ion-list {
  overflow: hidden;
  border: 1px solid var(--ion-border-color);
  border-radius: 1rem;
  background: var(--ion-card-background);
  box-shadow: 0 6px 20px rgba(var(--ion-color-primary-rgb), 0.04);
}

ion-item ion-icon[slot="start"] {
  color: var(--ion-color-primary);
}

ion-item ion-icon[slot="end"] {
  color: var(--ion-color-medium);
  font-size: 1rem;
}

ion-item h2 {
  overflow-wrap: anywhere;
  font-size: 0.94rem;
  font-weight: 600;
}

.account-tip {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 1rem;
  margin-top: 1.25rem;
  border-radius: 0.9rem;
  background: var(--app-surface-muted);
  color: var(--ion-text-color);
  font-size: 0.85rem;
  line-height: 1.5;
}

.account-tip ion-icon {
  flex: none;
  margin-top: 0.1rem;
  color: var(--ion-color-primary);
  font-size: 1.25rem;
}

.account-tip p {
  margin: 0;
}
</style>
