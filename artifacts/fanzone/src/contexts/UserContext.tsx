import React, { createContext, useContext, useState, useEffect } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface UserContextValue {
  userId: number;
  setUserId: (id: number) => void;
}

const UserContext = createContext<UserContextValue>({ userId: 1, setUserId: () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<number>(() => {
    const stored = localStorage.getItem("fanzone_user_id");
    return stored ? parseInt(stored, 10) : 1;
  });

  const setUserId = (id: number) => {
    localStorage.setItem("fanzone_user_id", String(id));
    setUserIdState(id);
  };

  useEffect(() => {
    setAuthTokenGetter(() => String(userId));
  }, [userId]);

  return <UserContext.Provider value={{ userId, setUserId }}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}
