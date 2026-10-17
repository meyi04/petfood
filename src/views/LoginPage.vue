<!-- src/views/LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Sign in</ion-title></ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form class="auth-form" @submit.prevent="submit">
        <h1>Welcome back</h1>
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
          autocomplete="current-password"
          label="Password"
          label-placement="stacked"
          type="password"
          required
        />
        <ion-button expand="block" type="submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </ion-button>
        <ion-button expand="block" fill="clear" router-link="/register">
          Create an account
        </ion-button>
      </form>
      <ion-toast
        :is-open="Boolean(message)"
        :message="message"
        duration="3500"
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
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const busy = ref(false);
const message = ref('');
const router = useRouter();
const authStore = useAuthStore();

async function submit(): Promise<void> {
  busy.value = true;
  try {
    await authStore.login(email.value, password.value);
    await router.replace(authStore.profile?.role === 'OWNER' ? '/tabs/owner' : '/tabs/home');
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : 'Could not sign in.';
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.auth-form {
  display: grid;
  gap: 1rem;
  max-width: 30rem;
  margin: 12vh auto 0;
}
</style>
