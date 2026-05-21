import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYbMe50kvGm1CvkxxKp8u9gISsJ2MzF-Y",
  authDomain: "cha-cozinha-isabela.firebaseapp.com",
  projectId: "cha-cozinha-isabela",
  storageBucket: "cha-cozinha-isabela.firebasestorage.app",
  messagingSenderId: "1005532598991",
  appId: "1:1005532598991:web:cac75cfa6680cd1bb59dba",
  measurementId: "G-MRE7G92408"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();