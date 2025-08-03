"use client";

import WalletConnectButton from "@/components/WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const { isLoggedIn, userAddress, login, logout } = useAuth();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Link href="/game">Go to the game</Link>
      </main>
    </div>
  );
}
