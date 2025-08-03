"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export function useAuth() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return {
    // Authentication state
    isLoggedIn: isConnected,
    isConnecting,
    userAddress: address,

    // Actions
    login: () => {
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
    },
    logout: () => disconnect(),

    // Additional info
    connectors,
  };
}
