<template>
  <ion-page>
    <ion-header>
      <ion-toolbar><ion-title>Account</ion-title></ion-toolbar>
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
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAvatar,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import {
  chevronForwardOutline,
  mailOutline,
  pawOutline,
  personCircleOutline,
  receiptOutline,
  ribbonOutline,
  searchOutline,
} from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.profile-heading {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  margin: 0.35rem 0 1.6rem;
  border: 1px solid rgb(25 123 104 / 9%);
  border-radius: 1.15rem;
  background: linear-gradient(135deg, #e6f2ec, #f8f4e9);
}

.profile-heading ion-avatar {
  flex: none;
  width: 4rem;
  height: 4rem;
  padding: 0.65rem;
  border: 2px solid white;
  background: white;
  color: var(--ion-color-primary);
  box-shadow: 0 4px 12px rgb(35 51 45 / 8%);
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

ion-list {
  overflow: hidden;
  border: 1px solid rgb(35 51 45 / 5%);
  border-radius: 1rem;
  background: white;
  box-shadow: 0 6px 20px rgb(35 51 45 / 4%);
}

ion-item ion-icon[slot="start"] {
  color: var(--ion-color-primary);
}

ion-item ion-icon[slot="end"] {
  color: #9aa49f;
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
  background: #edf4f0;
  color: #52675e;
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
