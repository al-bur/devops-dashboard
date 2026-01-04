import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDVE9xUFOK7mi8MxZgSgZKjqttL6l3Z2e0",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mini-sass.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mini-sass",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1043765838776",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1043765838776:web:41693dd1dd58405553054d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export { app };

export async function getFCMToken() {
  if (typeof window === "undefined") return null;

  try {
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
        "BPlhDELffaj_KbZqG4skAiolu-hdtR4HVoTuKNcaaQII_OdxdgM4Fu3dGxcljCGiWP618zAZ3Jy-nu6lVNExAWA",
    });
    return token;
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  if (typeof window === "undefined") return () => {};

  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
