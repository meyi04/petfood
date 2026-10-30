# Seeding the Oriental Mindoro store directory

The public listings in `data/oriental-mindoro-pet-stores.json` are separate from
PetFood partner stores. They are searchable and visible on the map, but do not
have PetFood products or accept in-app orders. The list is based on public map
listings checked on 2026-10-30; it is not guaranteed to include every business
or reflect current operating status. Confirm a store's details before visiting.

To seed or refresh the listings, use a Firebase service account with Firestore
write access. First deploy the client read-only rule for this collection:

```powershell
firebase deploy --only firestore:rules
```

Set `GOOGLE_APPLICATION_CREDENTIALS` to the service account's local JSON file
and set `GCLOUD_PROJECT` to the Firebase project ID, then run:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
$env:GCLOUD_PROJECT = "your-firebase-project-id"
npm run seed:stores
```

The script writes deterministic document IDs to `directoryStores` using merge
writes, so it can be run repeatedly. It does not modify owner-managed records
in `stores`. Never commit the service-account file. Firestore rules allow public
reads of `directoryStores` and deny all client writes; run the seeder only from
a trusted machine.

Each listing has a Google Maps search link as its source. Open the link to check
the current business name, location, and contact details.
