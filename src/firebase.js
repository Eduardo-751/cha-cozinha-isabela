import { initializeApp } from 'firebase/app';

import {
  getFirestore,
} from 'firebase/firestore';

import {
  getAuth,
  GoogleAuthProvider,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_DOMINIO',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_BUCKET',
  messagingSenderId: 'SEU_ID',
  appId: 'SEU_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const provider = new GoogleAuthProvider();