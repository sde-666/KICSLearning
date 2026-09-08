import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const dbId =
  !firebaseConfig.firestoreDatabaseId ||
  firebaseConfig.firestoreDatabaseId === '(default)'
    ? undefined
    : firebaseConfig.firestoreDatabaseId;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export default app;
