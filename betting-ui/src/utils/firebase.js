import React, { createContext } from 'react'
import firebase from "firebase/app";
import "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyBmu_N4ErnDHFQlpgjx9GPYjoU3hGDJ4NM",
    authDomain: "solana-rng-bets.firebaseapp.com",
    databaseURL: "https://solana-rng-bets-default-rtdb.firebaseio.com",
    projectId: "solana-rng-bets",
    storageBucket: "solana-rng-bets.appspot.com",
    messagingSenderId: "420920364835",
    appId: "1:420920364835:web:4ae5961f0912dcfd6dc696"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  const db = firebase.firestore();

  export {db}
  

// //   const bet = db.collection('Bets').doc('kAbhBFOAmZn2ExaCT7EV');

// //   bets.get().then(doc => {
// //     console.log(doc.data());
// //   });

// const bettingCollection = db.collection('Bets'); // use onsnapshot for real time updates

// const query = bettingCollection.where() // field, operator, value -> then call get (this returns an array of documents)
// use orderby for sort, chain .limit() to cap elements in array
