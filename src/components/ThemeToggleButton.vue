<template>
  <ion-button
    class="theme-button"
    :aria-label="themeStore.preference === 'dark' ? 'Switch to default theme' : 'Switch to dark theme'"
    :title="themeStore.preference === 'dark' ? 'Switch to default theme' : 'Switch to dark theme'"
    @click="themeStore.toggleTheme"
  >
    <ion-icon
      slot="icon-only"
      :icon="themeStore.preference === 'dark' ? sunnyOutline : moonOutline"
    />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();
</script>

<style>
.theme-button {
  width: 2.65rem;
  height: 2.65rem;
  margin: 0 0.4rem 0 0;
  --background: var(--ion-color-light);
  --background-hover: var(--ion-color-light-shade);
  --border-radius: 0.85rem;
  --color: var(--ion-text-color);
}
</style>
