"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { base } from "@reown/appkit/networks";

interface AuthContextType {
  isLoggedIn: boolean;
  isConnecting: boolean;
  userAddress: string | undefined;
  chainId: number | undefined;
  isOnBaseNetwork: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const login = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  const logout = () => disconnect();

  // Check if user is on Base mainnet - try both the imported base.id and hardcoded 8453
  const isOnBaseNetwork = chainId === base.id || chainId === 8453;

  // Debug logging
  console.log('AuthContext: Network detection:', {
    chainId,
    baseNetworkId: base.id,
    hardcodedBaseId: 8453,
    isOnBaseNetwork,
    isConnected,
    address,
  });

  const value: AuthContextType = {
    isLoggedIn: isConnected,
    isConnecting,
    userAddress: address,
    chainId,
    isOnBaseNetwork,
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
