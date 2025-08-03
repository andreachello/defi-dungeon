"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import TitleScene from "../game/scenes/TitleScene";
import DungeonScene from "../game/scenes/DungeonScene";
import InfoScene from "../game/scenes/InfoScene";
import InventoryScene from "../game/scenes/InventoryScene";
import MinimapScene from "../game/scenes/MinimapScene";
import TimerScene from "../game/scenes/TimerScene";
import HealthScene from "../game/scenes/HealthScene";
import ShopScene from "../game/scenes/ShopScene";
import WalletConnectButton from "./WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";

export default function Game() {
  const gameRef = useRef<Phaser.Game | null>(null);

  const { isLoggedIn, userAddress, login, logout } = useAuth();

  // Set up event listener for wallet connection
  useEffect(() => {
    const handleConnectWallet = () => {
      console.log("Connect wallet event received!");

      // Try to open the AppKit modal directly
      const appkitModal = (window as any).appkitModal;
      if (appkitModal && appkitModal.open) {
        console.log("Opening AppKit modal...");
        appkitModal.open();
      } else {
        console.log("AppKit modal not found, trying to trigger appkit-button...");
        // Fallback to triggering the button
        const appkitButton = document.querySelector('appkit-button');
        if (appkitButton) {
          console.log("Found appkit-button, dispatching click event...");
          appkitButton.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
        } else {
          console.log("No appkit-button found, falling back to login function");
          login(); // Final fallback
        }
      }
    };

    const handleRestartGame = () => {
      console.log("Restart game event received!");
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }

      // Force recreation of the game after a short delay
      setTimeout(() => {
        if (typeof window !== "undefined" && !gameRef.current) {
          // Make wallet status available to Phaser scenes
          (window as any).walletConnected = isLoggedIn;
          (window as any).userAddress = userAddress;

          const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.WEBGL,
            width: window.innerWidth,
            height: window.innerHeight,
            render: { pixelArt: true },
            fps: {
              target: 60,
              forceSetTimeOut: true
            },
            physics: {
              default: "arcade",
              arcade: {
                debug: false,
                gravity: { y: 0 },
                fps: 60
              },
            },
            scene: [
              TitleScene,
              ShopScene,
              DungeonScene,
              InfoScene,
              InventoryScene,
              MinimapScene,
              TimerScene,
              HealthScene,
            ],
            scale: {
              mode: Phaser.Scale.FIT,
              autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            parent: "game-container",
          };

          // Create the game instance
          gameRef.current = new Phaser.Game(config);

          // Force a refresh of the input system after game creation
          setTimeout(() => {
            if (gameRef.current) {
              gameRef.current.scale.refresh();
            }
          }, 100);
        }
      }, 100);
    };

    window.addEventListener('connectWallet', handleConnectWallet);
    window.addEventListener('restartGame', handleRestartGame);

    return () => {
      window.removeEventListener('connectWallet', handleConnectWallet);
      window.removeEventListener('restartGame', handleRestartGame);
    };
  }, [login]);

  useEffect(() => {
    if (typeof window !== "undefined" && !gameRef.current) {
      // Make wallet status available to Phaser scenes
      (window as any).walletConnected = isLoggedIn;
      (window as any).userAddress = userAddress;

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        width: window.innerWidth,
        height: window.innerHeight,
        render: { pixelArt: true },
        fps: {
          target: 60,
          forceSetTimeOut: true
        },
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
            gravity: { y: 0 },
            fps: 60
          },
        },
        scene: [
          TitleScene,
          ShopScene,
          DungeonScene,
          InfoScene,
          InventoryScene,
          MinimapScene,
          TimerScene,
          HealthScene,
        ],
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        parent: "game-container",
      };

      // Always create the game, but TitleScene will handle the wallet check
      gameRef.current = new Phaser.Game(config);

      // Force a refresh of the input system after game creation
      setTimeout(() => {
        if (gameRef.current) {
          gameRef.current.scale.refresh();
        }
      }, 100);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isLoggedIn, userAddress]);

  // Add resize handler to ensure proper scaling
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.refresh();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 pr-4 pt-2 z-10">
        <WalletConnectButton />
      </div>

      <div
        id="game-container"
        style={{ width: "100vw", height: "100vh", backgroundColor: "black" }}
      ></div>
    </div>
  );
}
