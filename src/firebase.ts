// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGaqWvtP-bXtObtPNkl_Kf8KnmTIPaPc0",
  authDomain: "copa-smi-2026.firebaseapp.com",
  projectId: "copa-smi-2026",
  storageBucket: "copa-smi-2026.firebasestorage.app",
  messagingSenderId: "919349921205",
  appId: "1:919349921205:web:75c20dd9789336239885fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa e exporta o Banco de Dados (Firestore)
export const db = getFirestore(app);