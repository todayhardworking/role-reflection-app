import admin from "firebase-admin";

const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;

if (!admin.apps.length) {
  if (!serviceAccount) {
    throw new Error("FIREBASE_ADMIN_SERVICE_ACCOUNT environment variable is not set");
  }

  const credentials = JSON.parse(serviceAccount);

  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export const adminDb = admin.firestore();
