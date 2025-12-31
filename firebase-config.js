// Firebase Configuration - Placeholder
// Replace the config object below with your actual Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyB4XqYQf3KTGU9sVyyedpNNVQMktjQ3fcA",
    authDomain: "keybird-faa53.firebaseapp.com",
    projectId: "keybird-faa53",
    storageBucket: "keybird-faa53.firebasestorage.app",
    messagingSenderId: "781396514002",
    appId: "1:781396514002:web:b1301b26de891cb5f4090b",
    measurementId: "G-9H6CSK0LFY"
};

// Initialize Firebase
let analytics;
try {
    firebase.initializeApp(firebaseConfig);
    analytics = firebase.analytics();
    console.log("Firebase initialized successfully.");
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

/**
 * Track a custom event in Firebase Analytics
 * @param {string} eventName - Name of the event
 * @param {object} params - Event parameters
 */
function trackActivity(eventName, params = {}) {
    console.log(`[Tracking] ${eventName}`, params);
    if (analytics) {
        analytics.logEvent(eventName, params);
    }
}

// Global accessor for tracking
window.trackActivity = trackActivity;
