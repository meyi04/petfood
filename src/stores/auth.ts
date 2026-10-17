// src/stores/auth.ts
import { defineStore } from 'pinia';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref } from 'vue';
import { auth, db } from '@/firebase';
import type { UserProfile, UserRole } from '@/types';

let authInitialization: Promise<void> | undefined;
let resolveAuthInitialization: (() => void) | undefined;
let authListenerStarted = false;

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null);
  const ready = ref(false);
  const error = ref<string | null>(null);

  function initialize(): Promise<void> {
    if (!authInitialization) {
      authInitialization = new Promise<void>((resolve) => {
        resolveAuthInitialization = resolve;
      });
    }

    if (!authListenerStarted) {
      authListenerStarted = true;
      onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          profile.value = firebaseUser ? await readProfile(firebaseUser) : null;
          error.value = null;
        } catch (cause) {
          profile.value = null;
          error.value =
            cause instanceof Error ? cause.message : 'Could not load your account.';
        } finally {
          ready.value = true;
          resolveAuthInitialization?.();
          resolveAuthInitialization = undefined;
        }
      });
    }

    return authInitialization;
  }

  async function readProfile(firebaseUser: User): Promise<UserProfile> {
    const snapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!snapshot.exists()) {
      throw new Error('Your account profile is missing. Please contact support.');
    }

    const data = snapshot.data();
    if (data.role !== 'OWNER' && data.role !== 'BUYER') {
      throw new Error('Your account has an invalid role. Please contact support.');
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName: typeof data.displayName === 'string' ? data.displayName : '',
      role: data.role,
    };
  }

  async function register(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ): Promise<void> {
    error.value = null;
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await updateProfile(credential.user, { displayName: displayName.trim() });
      const userProfile: UserProfile = {
        uid: credential.user.uid,
        email: credential.user.email ?? email.trim(),
        role,
        displayName: displayName.trim(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), userProfile);
      profile.value = userProfile;
      ready.value = true;
    } catch (cause) {
      await signOut(auth);
      throw cause;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    error.value = null;
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    profile.value = await readProfile(credential.user);
    ready.value = true;
  }

  async function logout(): Promise<void> {
    await signOut(auth);
    profile.value = null;
  }

  return { profile, ready, error, initialize, register, login, logout };
});
