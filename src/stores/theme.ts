import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ThemePreference = 'default' | 'dark';

const storageKey = 'petfood-theme';

function readPreference(): ThemePreference {
  return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'default';
}

export const useThemeStore = defineStore('theme', () => {
  const preference = ref<ThemePreference>(readPreference());

  function applyTheme(): void {
    document.documentElement.classList.toggle('ion-palette-dark', preference.value === 'dark');
  }

  function toggleTheme(): void {
    preference.value = preference.value === 'dark' ? 'default' : 'dark';
    localStorage.setItem(storageKey, preference.value);
    applyTheme();
  }

  return { preference, applyTheme, toggleTheme };
});
