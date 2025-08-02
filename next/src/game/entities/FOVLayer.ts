import Graphics from "../assets/Graphics";
import DungeonMap from "./Map";
import { Mrpas } from "mrpas";
import Phaser from "phaser";

const baseRadius = 7;
const fogAlpha = 0.8;
const dimmedAlpha = 0.4;

const lightDropoff = [0.7, 0.6, 0.3, 0.1];

// Alpha to transition per MS given maximum distance between desired
// and actual alpha
const alphaPerMs = 0.004;

function updateTileAlpha(
  desiredAlpha: number,
  delta: number,
  tile: Phaser.Tilemaps.Tile
) {
  // Update faster the further away we are from the desired value,
  // but restrict the lower bound so we don't get it slowing
  // down infinitley.
  const distance = Math.max(Math.abs(tile.alpha - desiredAlpha), 0.05);
  const updateFactor = alphaPerMs * delta * distance;
  if (tile.alpha > desiredAlpha) {
    tile.setAlpha(Phaser.Math.MinSub(tile.alpha, updateFactor, desiredAlpha));
  } else if (tile.alpha < desiredAlpha) {
    tile.setAlpha(Phaser.Math.MaxAdd(tile.alpha, updateFactor, desiredAlpha));
  }
}

export default class FOVLayer {
  public layer: Phaser.Tilemaps.DynamicTilemapLayer;
  private mrpas: Mrpas | undefined;
  private lastPos: Phaser.Math.Vector2;
  private map: DungeonMap;
  private currentRadius: number = baseRadius;
  private visionBoostActive: boolean = false;
  private inBossRoom: boolean = false;

  constructor(map: DungeonMap) {
    const utilTiles = map.tilemap.addTilesetImage("util");

    this.layer = map.tilemap
      .createBlankDynamicLayer("Dark", utilTiles, 0, 0)
      .fill(Graphics.util.indices.black);
    this.layer.setDepth(100);

    this.map = map;
    this.recalculate();

    this.lastPos = new Phaser.Math.Vector2({ x: -1, y: -1 });
  }

  recalculate() {
    this.mrpas = new Mrpas(
      this.map.width,
      this.map.height,
      (x: number, y: number) => {
        return this.map.tiles[y] && !this.map.tiles[y][x].collides;
      }
    );
  }

  // Add method to set vision radius
  setVisionRadius(radius: number) {
    this.currentRadius = radius;
    console.log(`Vision radius set to: ${radius}`);
  }

  // Add method to toggle vision boost
  setVisionBoost(active: boolean) {
    this.visionBoostActive = active;
    console.log(`Vision boost ${active ? 'activated' : 'deactivated'}`);
  }

  // Add method to check if player is in boss room
  checkBossRoom(playerX: number, playerY: number) {
    const tileX = this.map.tilemap!.worldToTileX(playerX);
    const tileY = this.map.tilemap!.worldToTileY(playerY);

    // Check if player is in a boss room
    for (let i = 0; i < this.map.rooms.length; i++) {
      const room = this.map.rooms[i];
      if (this.map.getBossLockedRooms().has(i)) {
        if (tileX >= room.x && tileX < room.x + room.width &&
          tileY >= room.y && tileY < room.y + room.height) {
          if (!this.inBossRoom) {
            console.log("Player entered boss room - disabling FOV!");
            this.inBossRoom = true;
          }
          return;
        }
      }
    }

    if (this.inBossRoom) {
      console.log("Player left boss room - re-enabling FOV!");
      this.inBossRoom = false;
    }
  }

  update(
    pos: Phaser.Math.Vector2,
    bounds: Phaser.Geom.Rectangle,
    delta: number
  ) {
    // Check if player is in boss room
    this.checkBossRoom(pos.x, pos.y);

    // If in boss room, disable FOV completely
    if (this.inBossRoom) {
      this.disableFOV(bounds, delta);
      return;
    }

    // If vision boost is active, dim the entire map uniformly
    if (this.visionBoostActive) {
      this.updateDimmedVision(bounds, delta);
    } else {
      // Normal FOV behavior
      if (!this.lastPos.equals(pos)) {
        this.updateMRPAS(pos);
        this.lastPos = pos.clone();
      }

      for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
        for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
          if (y < 0 || y >= this.map.height || x < 0 || x >= this.map.width) {
            continue;
          }
          const desiredAlpha = this.map.tiles[y][x].desiredAlpha;
          const tile = this.layer.getTileAt(x, y);
          updateTileAlpha(desiredAlpha, delta, tile);
        }
      }
    }
  }

  private disableFOV(bounds: Phaser.Geom.Rectangle, delta: number) {
    // Set all tiles to fully visible (alpha = 0) when in boss room
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (y < 0 || y >= this.map.height || x < 0 || x >= this.map.width) {
          continue;
        }

        // Mark all tiles as seen and set them to fully visible
        this.map.tiles[y][x].seen = true;
        this.map.tiles[y][x].desiredAlpha = 0; // Fully visible

        const tile = this.layer.getTileAt(x, y);
        updateTileAlpha(0, delta, tile);
      }
    }
  }

  private updateDimmedVision(bounds: Phaser.Geom.Rectangle, delta: number) {
    // Set all tiles to a uniform dimmed alpha
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (y < 0 || y >= this.map.height || x < 0 || x >= this.map.width) {
          continue;
        }

        // Mark all tiles as seen and set them to dimmed alpha
        this.map.tiles[y][x].seen = true;
        this.map.tiles[y][x].desiredAlpha = dimmedAlpha;

        const tile = this.layer.getTileAt(x, y);
        updateTileAlpha(dimmedAlpha, delta, tile);
      }
    }
  }

  updateMRPAS(pos: Phaser.Math.Vector2) {
    // Reset all tiles to fog for visited areas
    for (let row of this.map.tiles) {
      for (let tile of row) {
        if (tile.seen) {
          tile.desiredAlpha = fogAlpha;
        }
      }
    }

    // Single computation with current radius
    this.mrpas!.compute(
      pos.x,
      pos.y,
      this.currentRadius,
      (x: number, y: number) => this.map.tiles[y][x].seen,
      (x: number, y: number) => {
        const distance = Math.floor(
          new Phaser.Math.Vector2(x, y).distance(
            new Phaser.Math.Vector2(pos.x, pos.y)
          )
        );

        const rolloffIdx = distance <= this.currentRadius ? this.currentRadius - distance : 0;
        const alpha =
          rolloffIdx < lightDropoff.length ? lightDropoff[rolloffIdx] : 0;
        this.map.tiles[y][x].desiredAlpha = alpha;
        this.map.tiles[y][x].seen = true;
      }
    );
  }
}
