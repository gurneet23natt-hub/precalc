// Firebase settings for cross-device accounts.
//
// Leave this as null and the site uses browser-only accounts (each account works on one device).
// To let students log in on any device, create a Firebase project (see README.md) and replace
// null with the config object Firebase gives you, for example:
//
// window.FIREBASE_CONFIG = {
//   apiKey: "AIza...",
//   authDomain: "your-project.firebaseapp.com",
//   projectId: "your-project",
//   appId: "1:1234567890:web:abc123"
// };
//
// These values are meant to be public. Your Firestore security rules (firestore.rules) are what
// keep each student's data private.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyARcBUycJmrpXdTglJsDCDGJht6VtAXg2Q",
  authDomain: "precalc-98c5a.firebaseapp.com",
  projectId: "precalc-98c5a",
  storageBucket: "precalc-98c5a.firebasestorage.app",
  messagingSenderId: "60959565894",
  appId: "1:60959565894:web:2f63dd72b21edd6fd84247"
};
