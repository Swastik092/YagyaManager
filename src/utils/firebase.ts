import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTb6jp8W1UBcNR4w7AgTRySliFtKVK1ok",
  authDomain: "yagyamanager.firebaseapp.com",
  projectId: "yagyamanager",
  storageBucket: "yagyamanager.firebasestorage.app",
  messagingSenderId: "688314926788",
  appId: "1:688314926788:web:2632ddd2f860f1ee70ab91",
  measurementId: "G-3F2TJLE12G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
