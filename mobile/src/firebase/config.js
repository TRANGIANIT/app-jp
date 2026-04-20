import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDp6BbKY2tbMb9Xj6t1w1ITQhwTlT5o_Zo",
    authDomain: "trangian-ttdien.firebaseapp.com",
    databaseURL: "https://trangian-ttdien.firebaseio.com",
    projectId: "trangian-ttdien",
    storageBucket: "trangian-ttdien.appspot.com",
    messagingSenderId: "220108367293",
    appId: "1:220108367293:web:96449792e398d1672a9ed4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const database = getDatabase(app);
export default app;
