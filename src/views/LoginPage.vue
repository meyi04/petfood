<!-- src/views/LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <div class="brand-lockup" slot="start">
          <img src="/petfood-mark.svg" alt="" />
          <span>PetFood</span>
        </div>
      </ion-toolbar>
    </ion-header>
    <ion-content class="login-content">
      <main class="login-layout">
        <section class="welcome-panel">
          <div class="welcome-brand">
            <img src="/petfood-mark.svg" alt="" />
            <span>PetFood</span>
          </div>
          <div class="welcome-copy">
            <p class="eyebrow">GOOD FOOD. HAPPY PETS.</p>
            <h1>Care for your pets, one order at a time.</h1>
            <p>Discover trusted local pet stores and find their favorites, all in one place.</p>
          </div>
          <div class="welcome-paw" aria-hidden="true">🐾</div>
          <p class="welcome-footnote">Made for the ones who make a house a home.</p>
        </section>

        <section class="form-panel">
          <form class="auth-form" @submit.prevent="submit">
            <div class="form-heading">
              <p class="eyebrow">WELCOME BACK</p>
              <h2>Sign in to your account</h2>
              <p>Enter your details below to continue.</p>
            </div>
            <ion-input
              v-model="email"
              class="auth-input"
              autocomplete="email"
              label="Email address"
              label-placement="stacked"
              type="email"
              placeholder="you@example.com"
              required
            >
              <ion-icon slot="start" :icon="mailOutline" aria-hidden="true" />
            </ion-input>
            <ion-input
              v-model="password"
              class="auth-input"
              autocomplete="current-password"
              label="Password"
              label-placement="stacked"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
              required
            >
              <ion-icon slot="start" :icon="lockClosedOutline" aria-hidden="true" />
              <ion-button
                slot="end"
                class="password-toggle"
                fill="clear"
                type="button"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <ion-icon
                  slot="icon-only"
                  :icon="showPassword ? eyeOffOutline : eyeOutline"
                  aria-hidden="true"
                />
              </ion-button>
            </ion-input>
            <ion-button class="submit-button" expand="block" type="submit" :disabled="busy">
              {{ busy ? 'Signing in…' : 'Sign in' }}
              <ion-spinner v-if="busy" slot="end" name="crescent" />
            </ion-button>
            <p class="register-prompt">
              New to PetFood?
              <router-link to="/register">Create an account</router-link>
            </p>
          </form>
          <p class="secure-note">
            <ion-icon :icon="shieldCheckmarkOutline" />
            Your account details are securely protected.
          </p>
        </section>
      </main>
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
  IonIcon,
  IonInput,
  IonPage,
  IonSpinner,
  IonToast,
  IonToolbar,
} from '@ionic/vue';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
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
.login-content {
  --background: #f5f8f5;
}

.brand-lockup,
.welcome-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: #20463b;
  font-size: 1.05rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.brand-lockup {
  padding-left: 1rem;
}

.brand-lockup img {
  width: 2rem;
  height: 2rem;
  border-radius: 0.65rem;
}

.login-layout {
  display: grid;
  width: min(100%, 66rem);
  min-height: calc(100% - 2rem);
  grid-template-columns: 0.95fr 1.05fr;
  overflow: hidden;
  margin: 1rem auto;
  border: 1px solid rgb(35 51 45 / 6%);
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 20px 60px rgb(35 51 45 / 8%);
}

.welcome-panel {
  position: relative;
  display: flex;
  min-height: 35rem;
  flex-direction: column;
  overflow: hidden;
  padding: clamp(1.5rem, 4vw, 3rem);
  background: linear-gradient(145deg, #174f45, #257c66 68%, #46977d);
  color: white;
}

.welcome-brand {
  color: white;
}

.welcome-brand img {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgb(255 255 255 / 25%);
  border-radius: 0.8rem;
}

.welcome-copy {
  position: relative;
  z-index: 1;
  max-width: 25rem;
  margin: auto 0;
  padding: 3rem 0;
}

.eyebrow {
  margin: 0 0 0.55rem;
  color: var(--ion-color-primary);
  font-size: 0.67rem;
  font-weight: 750;
  letter-spacing: 0.1em;
}

.welcome-copy .eyebrow {
  color: #c2e4d5;
}

.welcome-copy h1 {
  margin: 0;
  color: white;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.055em;
}

.welcome-copy > p:last-child {
  max-width: 22rem;
  color: #e1f0e9;
  line-height: 1.65;
}

.welcome-paw {
  position: absolute;
  right: 1.2rem;
  bottom: 3rem;
  color: rgb(255 255 255 / 13%);
  font-size: 9rem;
  transform: rotate(-20deg);
}

.welcome-footnote {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #d0e8dc;
  font-size: 0.8rem;
}

.form-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1.5rem, 5vw, 4rem);
}

.auth-form {
  display: grid;
  gap: 1.1rem;
  width: 100%;
  max-width: 25rem;
  margin: auto;
}

.form-heading {
  margin-bottom: 0.5rem;
}

.form-heading h2 {
  margin: 0;
  color: #23332d;
  font-size: clamp(1.5rem, 4vw, 1.9rem);
  letter-spacing: -0.045em;
}

.form-heading > p:last-child {
  margin: 0.5rem 0 0;
  color: #78857f;
  font-size: 0.9rem;
}

.auth-input {
  --background: #f9fbf9;
  --border-color: #e0e8e3;
  --border-radius: 0.85rem;
  --highlight-color-focused: var(--ion-color-primary);
  --padding-start: 0.85rem;
  --padding-end: 0.55rem;
  min-height: 3.7rem;
  border: 1px solid #e0e8e3;
  border-radius: 0.85rem;
}

.auth-input ion-icon[slot="start"] {
  margin-inline-end: 0.65rem;
  color: #78857f;
  font-size: 1.1rem;
}

.password-toggle {
  height: 2.4rem;
  margin: 0;
  --color: #78857f;
}

.submit-button {
  min-height: 3.1rem;
  margin-top: 0.3rem;
  --border-radius: 0.85rem;
  box-shadow: 0 8px 18px rgb(25 123 104 / 18%);
}

.register-prompt {
  margin: 0.25rem 0 0;
  color: #78857f;
  font-size: 0.88rem;
  text-align: center;
}

.register-prompt a {
  color: var(--ion-color-primary);
  font-weight: 700;
  text-decoration: none;
}

.secure-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 2rem 0 0;
  color: #78857f;
  font-size: 0.76rem;
}

.secure-note ion-icon {
  color: var(--ion-color-primary);
  font-size: 1rem;
}

@media (max-width: 680px) {
  .login-layout {
    min-height: calc(100% - 1rem);
    grid-template-columns: 1fr;
    margin: 0.5rem auto;
    border-radius: 1.2rem;
  }

  .welcome-panel {
    min-height: 15rem;
    padding: 1.4rem;
  }

  .welcome-copy {
    max-width: 23rem;
    padding: 1.8rem 0 1rem;
  }

  .welcome-copy h1 {
    max-width: 20rem;
    font-size: clamp(1.9rem, 9vw, 2.5rem);
  }

  .welcome-copy > p:last-child {
    margin-bottom: 0;
    font-size: 0.86rem;
  }

  .welcome-paw {
    right: -0.5rem;
    bottom: 0.5rem;
    font-size: 6rem;
  }

  .form-panel {
    min-height: 24rem;
    padding: 1.6rem 1.25rem;
  }

  .secure-note {
    margin-top: 1.4rem;
  }
}
</style>
