import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYKVUxtewr9LaDnuOKymEPIwExXRfsmaw",
    authDomain: "luminous-torch-6042.firebaseapp.com",
    databaseURL: "https://luminous-torch-6042.firebaseio.com",
    projectId: "luminous-torch-6042",
    storageBucket: "luminous-torch-6042.firebasestorage.app",
    messagingSenderId: "229685137590",
    appId: "1:229685137590:ios:1724cfea834037d912d617"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const database = getDatabase(app);
export default app;
