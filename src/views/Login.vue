<!-- src/views/LoginPage.vue -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Login</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-input v-model="email" label="Email" type="email"></ion-input>
      <ion-input v-model="password" label="Password" type="password"></ion-input>
      <ion-button expand="block" @click="handleLogin" class="ion-margin-top">
        Login
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    console.log('Logged in user:', userCredential.user.uid);
    // Here you would check the user's role from Firestore and redirect
    router.replace('/tabs/tab1'); 
  } catch (error: any) {
    console.error('Login error:', error.message);
    // Add a toast to show the error to the user
  }
};
</script>