import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRt04Rm3Ry9nW_DlTm3TsR8bCzkPvxvSA",
  authDomain: "hotel-management-system-c3526.firebaseapp.com",
  // CRITICAL: Added the Belgium RTDB URL here
  databaseURL: "https://hotel-management-system-c3526-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "hotel-management-system-c3526",
  storageBucket: "hotel-management-system-c3526.firebasestorage.app",
  messagingSenderId: "7196606684",
  appId: "1:7196606684:web:66cb6e026807b517f17419",
  measurementId: "G-EB3RC1CJCB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exported services for use in your components and services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export default app;