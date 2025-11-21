import { firebaseApp } from "@/lib/firebase";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
} from "firebase/auth";

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const auth = getAuth(firebaseApp);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  const auth = getAuth(firebaseApp);
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  const auth = getAuth(firebaseApp);
  await signOut(auth);
}
