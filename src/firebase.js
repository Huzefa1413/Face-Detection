import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDDBrLewwoC7OOaT4S34yKwW8QVMI9brQU',
  authDomain: 'face-detection-102af.firebaseapp.com',
  projectId: 'face-detection-102af',
  storageBucket: 'face-detection-102af.appspot.com',
  messagingSenderId: '930143733838',
  appId: '1:930143733838:web:5220efb9f2946381881b1f',
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
