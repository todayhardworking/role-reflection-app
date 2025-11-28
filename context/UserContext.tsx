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

interface UserContextValue {
  currentUser: User | null;
  loading: boolean;
  timezone: string | null;
  timezoneLoading: boolean;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [timezoneLoading, setTimezoneLoading] = useState(false);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setTimezone(null);
      return;
    }

    let isMounted = true;
    const db = getFirestore(firebaseApp);

    const loadTimezone = async () => {
      try {
        setTimezoneLoading(true);
        const ref = doc(db, "users", currentUser.uid);
        const snapshot = await getDoc(ref);
        const data = snapshot.data() as { timezone?: unknown } | undefined;
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const resolvedTimezone = typeof data?.timezone === "string" && data.timezone ? data.timezone : browserTz;

        if (!data?.timezone) {
          await setDoc(ref, { timezone: resolvedTimezone }, { merge: true });
        }

        if (isMounted) {
          setTimezone(resolvedTimezone);
        }
      } catch (error) {
        console.error("Failed to load timezone", error);
        if (isMounted) {
          setTimezone(null);
        }
      } finally {
        if (isMounted) {
          setTimezoneLoading(false);
        }
      }
    };

    loadTimezone();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const signOut = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  const value = useMemo(
    () => ({ currentUser, loading, timezone, timezoneLoading, signOut }),
    [currentUser, loading, timezone, timezoneLoading],
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
