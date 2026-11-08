# Updating installed apps

## Installed as an Android app (Capacitor)

The Android app includes a bundled copy of the web app. Deploying the website alone does not update that installed copy.

1. Make and verify your app changes.
2. Run `npm run build:android` from the project folder. This builds the web app and syncs the generated files into Android.
3. Open the `android` folder in Android Studio and generate a signed APK or app bundle.
4. Distribute the new signed build and install it over the old app. It must use the same signing key as the previously installed release.

The Android `versionCode` must be higher for every release. This update sets it to `2` / version name `1.1`; increase `versionCode` again for the next Android release. If the previous release was signed with a different key, Android will not install it as an in-place update; uninstalling first may remove local app data.

## Installed from the website

If installed from the browser using “Add to Home screen,” publish the new website build to its hosting service. Close and reopen the installed app, or reload the page, to fetch the latest hosted version.

## Currency

All app currency formatting is set centrally to Philippine pesos (`PHP`, `en-PH`). Existing product prices and order amounts are numeric values and are now displayed as pesos; they are not converted from another currency.
