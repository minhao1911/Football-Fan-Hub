import React, { createContext, useContext } from "react";
import { useGetMe } from "@workspace/api-client-react";

interface UserContextValue {
  userId: number;
}

const UserContext = createContext<UserContextValue>({ userId: 0 });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMe();
  const userId = me?.id ?? 0;

  return <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(UserContext);
}
