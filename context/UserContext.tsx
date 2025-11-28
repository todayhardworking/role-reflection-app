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

type UserWithTimezone = User & { timezone?: string };

interface UserContextValue {
  currentUser: UserWithTimezone | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserWithTimezone | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) {
        return;
      }

      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const db = getFirestore(firebaseApp);
        const userDocRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data() as { timezone?: string } | undefined;

        let timezone = userData?.timezone;

        if (!timezone) {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await setDoc(userDocRef, { timezone: timeZone }, { merge: true });
          timezone = timeZone;
        }

        const currentAuthUser = auth.currentUser;
        if (!isMounted || !currentAuthUser || currentAuthUser.uid !== user.uid) {
          return;
        }

        setCurrentUser(Object.assign(user, { timezone }));
      } catch (error) {
        const currentAuthUser = auth.currentUser;
        if (!isMounted || !currentAuthUser || currentAuthUser.uid !== user.uid) {
          return;
        }

        setCurrentUser(Object.assign(user, {}));
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
