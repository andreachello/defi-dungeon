"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface AuthContextType {
  isLoggedIn: boolean;
  isConnecting: boolean;
  userAddress: string | undefined;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const login = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const logout = () => disconnect();

  const value: AuthContextType = {
    isLoggedIn: isConnected,
    isConnecting,
    userAddress: address,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
