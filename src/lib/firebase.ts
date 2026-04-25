import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    // Avoid logging errors if the doc simply doesn't exist or permissions are restrictive
    await getDocFromServer(doc(db, 'system', 'health'));
  } catch (error: any) {
    if (error.code === 'unavailable' || (error.message && error.message.includes('the client is offline'))) {
      console.warn("Firebase connectivity warning: The client might be offline or the connection is unstable.");
    }
  }
}
testConnection();
