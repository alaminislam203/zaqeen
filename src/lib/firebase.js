// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// আপনার Firebase Console থেকে নিচের তথ্যগুলো সংগ্রহ করে বসান
const firebaseConfig = {
  apiKey: "AIzaSyDw1LLobgPp5pORVyaA-pCEObL0NurEntQ",
  authDomain: "zaqeen-aa745.firebaseapp.com",
  projectId: "zaqeen-aa745",
  storageBucket: "zaqeen-aa745.appspot.com",
  messagingSenderId: "717907006994",
  appId: "1:717907006994:web:edb10a58b6ebf7137deacb"
};

// Initialize Firebase (Server-side friendly)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };