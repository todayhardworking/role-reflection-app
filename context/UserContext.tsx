"use client";

import { firebaseApp } from "@/lib/firebase";
import { signOutUser } from "@/lib/auth";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CurrentUserWithTimezone = User & { timezone?: string };

interface UserContextValue {
  currentUser: CurrentUserWithTimezone | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUserWithTimezone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userDocRef);
        const firestoreTimezone = snapshot.data()?.timezone as string | undefined;

        let timezone = firestoreTimezone;

        if (!firestoreTimezone) {
          const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await setDoc(userDocRef, { timezone: resolvedTimeZone }, { merge: true });
          timezone = resolvedTimeZone;
        }

        if (isMounted) {
          setCurrentUser(Object.assign(user, { timezone }));
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
        if (isMounted) {
          setCurrentUser(user);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({ currentUser, loading, signOut }),
    [currentUser, loading],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const UserContextProvider = UserProvider;

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
