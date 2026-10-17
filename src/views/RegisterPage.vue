<!-- src/views/RegisterPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="brand-lockup" slot="start">
          <img src="/petfood-mark.svg" alt="" />
          <span>PetFood</span>
        </div>
        <ion-title>Create account</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form class="auth-form" @submit.prevent="submit">
        <h1>Join PetFoodApp</h1>
        <ion-input
          v-model="displayName"
          autocomplete="name"
          label="Display name"
          label-placement="stacked"
          required
        />
        <ion-input
          v-model="email"
          autocomplete="email"
          label="Email"
          label-placement="stacked"
          type="email"
          required
        />
        <ion-input
          v-model="password"
          autocomplete="new-password"
          label="Password (at least 6 characters)"
          label-placement="stacked"
          type="password"
          :minlength="6"
          required
        />
        <ion-select
          v-model="role"
          label="I am a"
          label-placement="stacked"
          interface="popover"
        >
          <ion-select-option value="BUYER">Buyer</ion-select-option>
          <ion-select-option value="OWNER">Store owner</ion-select-option>
        </ion-select>
        <ion-button expand="block" type="submit" :disabled="busy">
          {{ busy ? 'Creating account…' : 'Register' }}
        </ion-button>
        <ion-button expand="block" fill="clear" router-link="/login">
          Already have an account? Sign in
        </ion-button>
        <ion-text v-if="alreadyRegistered" color="danger">
          <p>An account with this email already exists. Sign in to continue.</p>
          <ion-button expand="block" router-link="/login">Go to sign in</ion-button>
        </ion-text>
      </form>
      <ion-toast
        :is-open="Boolean(message) && !alreadyRegistered"
        :message="message"
        duration="4000"
        color="danger"
        @did-dismiss="message = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';
import type { UserRole } from '@/types';

const displayName = ref('');
const email = ref('');
const password = ref('');
const role = ref<UserRole>('BUYER');
const busy = ref(false);
const message = ref('');
const alreadyRegistered = ref(false);
const router = useRouter();
const authStore = useAuthStore();

async function submit(): Promise<void> {
  busy.value = true;
  message.value = '';
  alreadyRegistered.value = false;
  try {
    await authStore.register(email.value, password.value, displayName.value, role.value);
    await router.replace(role.value === 'OWNER' ? '/tabs/owner' : '/tabs/home');
  } catch (cause) {
    const code =
      cause instanceof Error && 'code' in cause && typeof cause.code === 'string'
        ? cause.code
        : '';
    if (code === 'auth/email-already-in-use') {
      alreadyRegistered.value = true;
      message.value = 'An account with this email already exists. Sign in to continue.';
    } else {
      message.value =
        cause instanceof Error ? cause.message : 'Could not create your account.';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.brand-lockup {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.75rem;
  color: #20463b;
  font-size: 0.95rem;
  font-weight: 750;
}

.brand-lockup img {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 0.55rem;
}

.auth-form {
  display: grid;
  gap: 1rem;
  max-width: 30rem;
  margin: 8vh auto 0;
}
</style>
