# Administrator access

Admin accounts are not offered during public registration. To grant access:

1. Register the account normally, or locate its existing Firebase Authentication user.
2. In Firebase Console, open Firestore Database and find `users/{uid}` using that account's Authentication UID.
3. Set the document's `role` field to the exact string `ADMIN`.
4. Deploy the updated Firestore rules with `firebase deploy --only firestore:rules`.
5. Have the user sign out and back in so the app loads the updated role.

The admin console can review accounts, change account roles, review/remove catalog products, remove shops only when they have no products or order history, and manage order status transitions. It does not delete Firebase Authentication accounts. A registered account can only create its own profile as `BUYER` or `OWNER`; administrator access must be granted by an existing administrator or directly in Firebase.
