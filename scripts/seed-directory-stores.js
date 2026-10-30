import { readFile } from 'node:fs/promises';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function seedStores() {
  const stores = JSON.parse(
    await readFile(new URL('../data/oriental-mindoro-pet-stores.json', import.meta.url), 'utf8'),
  );
  const ids = new Set();
  for (const store of stores) {
    if (
      !store.id ||
      ids.has(store.id) ||
      !store.name ||
      !store.municipality ||
      !Number.isFinite(store.lat) ||
      !Number.isFinite(store.lng) ||
      Math.abs(store.lat) > 90 ||
      Math.abs(store.lng) > 180 ||
      !store.sourceUrl
    ) {
      throw new Error(`Invalid or duplicate directory store data: ${JSON.stringify(store)}`);
    }
    ids.add(store.id);
  }

  if (process.argv.includes('--dry-run')) {
    console.log(`Validated ${stores.length} public store listings.`);
    return;
  }

  const projectId = process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Set GCLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID before seeding stores.');
  }

  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault(), projectId });
  }

  const db = getFirestore();
  for (let index = 0; index < stores.length; index += 400) {
    const batch = db.batch();
    for (const store of stores.slice(index, index + 400)) {
      batch.set(db.collection('directoryStores').doc(store.id), {
        ...store,
        ownerId: '',
        imageUrl: '',
        directoryOnly: true,
        source: 'Google Maps',
        verifiedOn: '2026-10-30',
      }, { merge: true });
    }
    await batch.commit();
  }

  console.log(`Seeded ${stores.length} public store listings into ${projectId}/directoryStores.`);
}

seedStores().catch((cause) => {
  console.error('Could not seed the public store directory:', cause);
  process.exitCode = 1;
});
