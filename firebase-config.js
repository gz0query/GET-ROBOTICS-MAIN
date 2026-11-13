import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgU1it2Fgw_MOXuGgXrn-t9Bn6ZlFInsA",
  authDomain: "get-robotics-hub.firebaseapp.com",
  projectId: "get-robotics-hub",
  storageBucket: "get-robotics-hub.firebasestorage.app",
  messagingSenderId: "105194120139",
  appId: "1:105194120139:web:81a15d1c20054756c2cc4e",
  measurementId: "G-HQ32CB59KJ",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const DEFAULT_ADMIN_EMAILS = [
  "goodluckbello85@gmail.com",
  "info@getrobotics.com",
];

export async function isUserAuthorizedAdmin(user) {
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email || user.emailVerified !== true) return false;
  if (DEFAULT_ADMIN_EMAILS.includes(email)) return true;

  try {
    const adminsSnapshot = await getDoc(doc(db, "getrobotics_settings", "admins"));
    const emails = adminsSnapshot.exists() ? adminsSnapshot.data().emails : [];
    return Array.isArray(emails)
      && emails.some((adminEmail) => typeof adminEmail === "string" && adminEmail.trim().toLowerCase() === email);
  } catch (error) {
    console.warn("Unable to check the additional administrator allowlist.", error);
    return false;
  }
}

export {
  app,
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  collection,
  doc,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
};
