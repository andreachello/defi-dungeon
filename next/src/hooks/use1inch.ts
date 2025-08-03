"use client";

import { useState, useCallback } from "react";
import { SwapQuote, TokenInfo } from "@/lib/1inch-api";

export function use1inch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(
    async (
      fromToken: string,
      toToken: string,
      amount: string,
      chainId: number = 1
    ): Promise<SwapQuote | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          fromToken,
          toToken,
          amount,
          chainId: chainId.toString(),
        });

        const response = await fetch(`/api/1inch/quote?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to get quote: ${response.statusText}`);
        }

        const quote = await response.json();
        return quote;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSwap = useCallback(
    async (
      fromToken: string,
      toToken: string,
      amount: string,
      fromAddress: string,
      slippage: number = 1,
      chainId: number = 1
    ): Promise<SwapQuote | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          fromToken,
          toToken,
          amount,
          fromAddress,
          slippage: slippage.toString(),
          chainId: chainId.toString(),
        });

        const response = await fetch(`/api/1inch/swap?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to get swap: ${response.statusText}`);
        }

        const swap = await response.json();
        return swap;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getTokens = useCallback(
    async (chainId: number = 1): Promise<TokenInfo[] | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          chainId: chainId.toString(),
        });

        const response = await fetch(`/api/1inch/tokens?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to get tokens: ${response.statusText}`);
        }

        const tokens = await response.json();
        return tokens;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getGasPrice = useCallback(
    async (
      chainId: number = 1
    ): Promise<{
      fast: number;
      standard: number;
      slow: number;
    } | null> => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          chainId: chainId.toString(),
        });

        const response = await fetch(`/api/1inch/gas-price?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to get gas price: ${response.statusText}`);
        }

        const gasPrice = await response.json();
        return gasPrice;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getQuote,
    getSwap,
    getTokens,
    getGasPrice,
    loading,
    error,
    clearError: () => setError(null),
  };
}
