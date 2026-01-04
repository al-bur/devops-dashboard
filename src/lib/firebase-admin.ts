import admin from "firebase-admin";

function getFirebaseAdmin(): typeof admin | null {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!privateKey) {
    console.warn("Firebase Admin: FIREBASE_ADMIN_PRIVATE_KEY not configured");
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mini-sass",
        clientEmail:
          process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
          "firebase-adminsdk-fbsvc@mini-sass.iam.gserviceaccount.com",
        privateKey,
      }),
    });
  }

  return admin;
}

export { admin, getFirebaseAdmin };
