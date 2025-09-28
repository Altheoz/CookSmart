
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";




const firebaseConfig = {
  apiKey: "AIzaSyDYmMhNdoYH8GGyguhCPBwmauJ76FsBDdk",
  authDomain: "cooksmart-e12c6.firebaseapp.com",
  projectId: "cooksmart-e12c6",
  storageBucket: "cooksmart-e12c6.firebasestorage.app",
  messagingSenderId: "6984564700",
  appId: "1:6984564700:web:81b03a1a693653dc0bd919"
};


export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage
    )
});
export const db = getFirestore(app);
export const functions = getFunctions(app);