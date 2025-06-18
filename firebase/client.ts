// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDB3d5102LQYRuD7zmm13pApCmWVf7E43M",
  authDomain: "interview-e8a25.firebaseapp.com",
  projectId: "interview-e8a25",
  storageBucket: "interview-e8a25.firebasestorage.app",
  messagingSenderId: "53423874509",
  appId: "1:53423874509:web:30aaf922d00d156b422484",
  measurementId: "G-1BFJ98BDWY"
};

// Initialize Firebase
const app = !getApps.length?initializeApp(firebaseConfig):getApp();
export const auth=getAuth(app);
export const db=getFirestore(app);