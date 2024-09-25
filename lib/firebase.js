// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyByoLh8QZWurN70g3UzdvsGxD1VtHLru6w",
    authDomain: "web-browsers-cf17d.firebaseapp.com",
    projectId: "web-browsers-cf17d",
    storageBucket: "web-browsers-cf17d.appspot.com",
    messagingSenderId: "511329516020",
    appId: "1:511329516020:web:a03e8de6acb47e4c36a1a1",
    measurementId: "G-7WR35V1RF7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
