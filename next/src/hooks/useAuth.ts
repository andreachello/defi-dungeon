"use client";

import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { base } from "@reown/appkit/networks";

export function useAuth() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Check if user is on Base mainnet - try both the imported base.id and hardcoded 8453
  const isOnBaseNetwork = chainId === base.id || chainId === 8453;

  return {
    // Authentication state
    isLoggedIn: isConnected,
    isConnecting,
    userAddress: address,
    chainId,
    isOnBaseNetwork,

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
