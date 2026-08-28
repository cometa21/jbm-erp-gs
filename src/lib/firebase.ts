import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore database with the configured database ID
// Enable long-polling auto-detection to prevent WebSocket/gRPC connection drops in container and proxy environments
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    }, firebaseConfig.firestoreDatabaseId || undefined);
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  }
})();

export default app;

