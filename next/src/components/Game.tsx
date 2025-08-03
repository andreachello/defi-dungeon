"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import DungeonScene from "../game/scenes/DungeonScene";
import InfoScene from "../game/scenes/InfoScene";
import InventoryScene from "../game/scenes/InventoryScene";
import MinimapScene from "../game/scenes/MinimapScene";
import TimerScene from "../game/scenes/TimerScene";
import HealthScene from "../game/scenes/HealthScene";
import WalletConnectButton from "./WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";

export default function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);

  const { isLoggedIn, userAddress, login, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        width: window.innerWidth,
        height: window.innerHeight,
        render: { pixelArt: true },
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
            gravity: { y: 0 },
          },
        },
        scene: [
          DungeonScene,
          InfoScene,
          InventoryScene,
          MinimapScene,
          TimerScene,
          HealthScene,
        ],
        scale: {
          mode: Phaser.Scale.RESIZE,
        },
        parent: "game-container",
      };

      isLoggedIn && (gameRef.current = new Phaser.Game(config));
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isLoggedIn]);

  return (
    <div className="bg-black">
      <div className="flex justify-end pr-4 pt-4">
        <WalletConnectButton />
      </div>

      <div
        id="game-container"
        style={{ width: "100vw", height: "100vh", backgroundColor: "black" }}
      ></div>
    </div>
  );
}
