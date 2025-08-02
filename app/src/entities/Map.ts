import Dungeoneer from "dungeoneer";
import Tile, { TileType } from "./Tile";
import Slime from "./Slime";
import Graphics from "../assets/Graphics";
import DungeonScene from "../scenes/DungeonScene";
import Player from "./Player";
import Chest from "./Chest";

export default class Map {
  public readonly tiles: Tile[][];
  public readonly width: number;
  public readonly height: number;
  public readonly tilemap: Phaser.Tilemaps.Tilemap;
  public readonly wallLayer: Phaser.Tilemaps.StaticTilemapLayer;
  public readonly doorLayer: Phaser.Tilemaps.DynamicTilemapLayer;
  public readonly decorationLayer: Phaser.Tilemaps.DynamicTilemapLayer; // Add decoration layer

  public readonly startingX: number;
  public readonly startingY: number;

  public readonly slimes: Slime[];
  public readonly chests: Chest[] = [];

  public readonly rooms: Dungeoneer.Room[];

  // Add scene property
  private scene: DungeonScene;

  // Add room locking properties
  private lockedRooms: Set<number> = new Set();
  private goldLockedRooms: Set<number> = new Set();
  private bossLockedRooms: Set<number> = new Set(); // Add boss rooms set

  // Add player reference
  private player: Player | null = null;

  // Static property to track if boss key has been dropped
  private static bossKeyDropped: boolean = false;

  constructor(width: number, height: number, scene: DungeonScene) {
    // Store the scene reference
    this.scene = scene;

    // Try multiple generations and pick the one with the largest room
    let bestDungeon = null;
    let bestRooms = null;
    let largestRoomArea = 0;
    const attempts = 10; // Try 10 times (you can increase for even better results)

    for (let i = 0; i < attempts; i++) {
      const dungeon = Dungeoneer.build({
        width: width,
        height: height,
        roomAttempts: 5000,
        roomSize: {
          min: { width: 4, height: 4 },
          max: { width: Math.floor(width * 0.8), height: Math.floor(height * 0.8) }
        },
        corridorWidth: 1,
        removeDeadends: false,
        addStairs: false
      });
      const rooms = dungeon.rooms;
      const largest = rooms.reduce((max, r) => Math.max(max, r.width * r.height), 0);
      if (largest > largestRoomArea) {
        bestDungeon = dungeon;
        bestRooms = rooms;
        largestRoomArea = largest;
      }
    }

    const dungeon = bestDungeon;
    this.rooms = bestRooms;

    this.width = width;
    this.height = height;

    this.tiles = [];
    for (let y = 0; y < height; y++) {
      this.tiles.push([]);
      for (let x = 0; x < width; x++) {
        const tileType = Tile.tileTypeFor(dungeon.tiles[x][y].type);
        this.tiles[y][x] = new Tile(tileType, x, y, this);
      }
    }

    // Determine which rooms should be locked
    this.determineLockedRooms();

    // Lock doors leading to locked rooms
    this.lockRoomDoors();

    const toReset = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type === TileType.Wall && tile.isEnclosed()) {
          toReset.push({ y: y, x: x });
        }
      }
    }

    toReset.forEach(d => {
      this.tiles[d.y][d.x] = new Tile(TileType.None, d.x, d.y, this);
    });

    this.tilemap = scene.make.tilemap({
      tileWidth: Graphics.environment.width,
      tileHeight: Graphics.environment.height,
      width: width,
      height: height
    });

    const dungeonTiles = this.tilemap.addTilesetImage(
      Graphics.environment.name,
      Graphics.environment.name,
      Graphics.environment.width,
      Graphics.environment.height,
      Graphics.environment.margin,
      Graphics.environment.spacing
    );

    const groundLayer = this.tilemap
      .createBlankDynamicLayer("Ground", dungeonTiles, 0, 0)
      .randomize(
        0,
        0,
        this.width,
        this.height,
        Graphics.environment.indices.floor.outerCorridor
      );

    this.slimes = [];
    this.chests = [];

    // Place enemies and chests first
    for (let roomIndex = 0; roomIndex < dungeon.rooms.length; roomIndex++) {
      const room = dungeon.rooms[roomIndex];
      groundLayer.randomize(
        room.x - 1,
        room.y - 1,
        room.width + 2,
        room.height + 2,
        Graphics.environment.indices.floor.outer
      );

      if (room.height < 4 || room.width < 4) {
        continue;
      }

      // Check if this room is locked
      const isLocked = this.lockedRooms.has(roomIndex);
      const isGoldLocked = this.goldLockedRooms.has(roomIndex);
      const isBossRoom = this.bossLockedRooms.has(roomIndex);

      const roomTL = this.tilemap.tileToWorldXY(room.x + 1, room.y + 1);
      const roomBounds = this.tilemap.tileToWorldXY(
        room.x + room.width - 1,
        room.y + room.height - 1
      );

      // Spawn chest in normal rooms with 40% chance
      if (!isLocked && !isGoldLocked && !isBossRoom) {
        const chestChance = Math.random();
        if (chestChance < 0.4) { // 40% chance
          console.log(`Placing chest in room ${roomIndex} at (${room.x}, ${room.y})`);
          this.placeChestInRoom(room, roomTL, roomBounds);
        } else {
          console.log(`Room ${roomIndex} - no chest (rolled ${chestChance.toFixed(2)})`);
        }
      } else {
        console.log(`Room ${roomIndex} is locked - no chest placed`);
      }

      // Increase slime count based on room type
      let numSlimes: number;
      if (isLocked || isGoldLocked || isBossRoom) {
        // Locked rooms have more enemies (3-6 slimes)
        numSlimes = Phaser.Math.Between(3, 6);
      } else {
        // Normal rooms have fewer enemies (1-3 slimes)
        numSlimes = Phaser.Math.Between(1, 3);
      }

      for (let i = 0; i < numSlimes; i++) {
        const slime = new Slime(
          Phaser.Math.Between(roomTL.x, roomBounds.x),
          Phaser.Math.Between(roomTL.y, roomBounds.y),
          scene
        );

        // Mark slimes in locked rooms to drop appropriate keys
        if (isBossRoom) {
          // Boss rooms don't drop boss keys anymore
          (slime as any).dropsGoldKey = true;
        } else if (isGoldLocked) {
          // Check if player already has a boss key
          const player = (scene as DungeonScene).player;
          const hasBossKey = player && player.inventory.hasItem("boss_key");

          if (!hasBossKey) {
            // Only drop boss key if player doesn't have one
            (slime as any).dropsBossKey = true;
            console.log(`Boss key assigned to slime in gold locked room ${roomIndex}`);
          } else {
            // Player already has boss key, drop gold key instead
            (slime as any).dropsGoldKey = true;
          }
        } else if (isLocked) {
          (slime as any).dropsGoldKey = true;
        }

        this.slimes.push(slime);
      }
    }

    // Now choose starting room (must be unlocked) and ensure safe spawn
    const unlockedRooms = this.rooms.filter((_, index) =>
      !this.lockedRooms.has(index) &&
      !this.goldLockedRooms.has(index) &&
      !this.bossLockedRooms.has(index) // Add boss room check
    );

    if (unlockedRooms.length === 0) {
      console.error("No unlocked rooms available for spawn! This should not happen.");
      // Fallback: use the first room regardless
      const firstRoom = this.rooms[0];
      this.startingX = Math.floor(firstRoom.x + firstRoom.width / 2);
      this.startingY = Math.floor(firstRoom.y + firstRoom.height / 2);
    } else {
      // Try to find a safe spawn position
      let safePositionFound = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!safePositionFound && attempts < maxAttempts) {
        const roomNumber = Math.floor(Math.random() * unlockedRooms.length);
        const selectedRoom = unlockedRooms[roomNumber];

        // Try multiple positions within the room
        for (let posAttempt = 0; posAttempt < 10; posAttempt++) {
          const spawnX = Math.floor(selectedRoom.x + 1 + Math.random() * (selectedRoom.width - 2));
          const spawnY = Math.floor(selectedRoom.y + 1 + Math.random() * (selectedRoom.height - 2));

          // Check if this position is safe (not on top of an enemy)
          const isSafe = this.isPositionSafe(spawnX, spawnY);

          if (isSafe) {
            this.startingX = spawnX;
            this.startingY = spawnY;
            safePositionFound = true;
            console.log(`Player spawning safely in unlocked room ${this.rooms.indexOf(selectedRoom)} at (${spawnX}, ${spawnY})`);
            break;
          }
        }
        attempts++;
      }

      // If no safe position found, use the center of the first unlocked room
      if (!safePositionFound) {
        const firstRoom = unlockedRooms[0];
        this.startingX = Math.floor(firstRoom.x + firstRoom.width / 2);
        this.startingY = Math.floor(firstRoom.y + firstRoom.height / 2);
        console.log(`No safe position found, using center of room ${this.rooms.indexOf(firstRoom)}`);
      }
    }

    this.tilemap.convertLayerToStatic(groundLayer).setDepth(1);

    const wallLayer = this.tilemap.createBlankDynamicLayer(
      "Wall",
      dungeonTiles,
      0,
      0
    );

    this.doorLayer = this.tilemap.createBlankDynamicLayer(
      "Door",
      dungeonTiles,
      0,
      0
    );

    // Add decoration layer for torches
    this.decorationLayer = this.tilemap.createBlankDynamicLayer(
      "Decoration",
      dungeonTiles,
      0,
      0
    );

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = this.tiles[y][x];
        if (tile.type === TileType.Wall) {
          wallLayer.putTileAt(tile.spriteIndex(), x, y);
        } else if (tile.type === TileType.Door) {
          this.doorLayer.putTileAt(tile.spriteIndex(), x, y);
        } else if (tile.type === TileType.LockedDoor) {
          this.doorLayer.putTileAt(tile.spriteIndex(), x, y);
        } else if (tile.type === TileType.GoldLockedDoor) {
          this.doorLayer.putTileAt(tile.spriteIndex(), x, y);
        } else if (tile.type === TileType.BossDoor) {
          this.doorLayer.putTileAt(tile.spriteIndex(), x, y);
        }
      }
    }
    wallLayer.setCollisionBetween(0, 0x7f);
    // Set collision for regular doors only (these will break when touched)
    const regularDoors = [
      Graphics.environment.indices.doors.horizontal,
      Graphics.environment.indices.doors.vertical
    ];

    this.doorLayer.setTileIndexCallback(
      regularDoors,
      (sprite: unknown, tile: Phaser.Tilemaps.Tile) => {
        // Only break door if player touched it, not slimes
        if (sprite && (sprite as any).scene && (sprite as any).scene.player &&
          (sprite as any).scene.player.sprite === sprite) {
          // Regular door behavior - always break
          this.doorLayer.putTileAt(
            Graphics.environment.indices.doors.destroyed,
            tile.x,
            tile.y
          );
          this.tileAt(tile.x, tile.y)!.open();
          scene.fov!.recalculate();
        }
      },
      this
    );

    // Add callback for locked doors
    const lockedDoors = [
      Graphics.environment.indices.doors.lockedHorizontal,
      Graphics.environment.indices.doors.lockedVertical
    ];

    this.doorLayer.setTileIndexCallback(
      lockedDoors,
      (sprite: unknown, tile: Phaser.Tilemaps.Tile) => {
        // Only check for keys if player touched it, not slimes
        if (sprite && (sprite as any).scene && (sprite as any).scene.player &&
          (sprite as any).scene.player.sprite === sprite) {
          // Check if player has a key
          if (this.player && this.player.hasKey()) {
            // Consume the key
            this.player.useKey();

            // Treat locked door like a regular door - break it
            this.doorLayer.putTileAt(
              Graphics.environment.indices.doors.destroyed,
              tile.x,
              tile.y
            );
            this.tileAt(tile.x, tile.y)!.open();
            scene.fov!.recalculate();
          } else {
            // Show feedback when trying to open locked door without key
            this.showLockedDoorMessage(scene, tile.x, tile.y);
          }
        }
      },
      this
    );

    const goldLockedDoors = [
      Graphics.environment.indices.doors.goldLockedHorizontal,
      Graphics.environment.indices.doors.goldLockedVertical
    ];

    this.doorLayer.setTileIndexCallback(
      goldLockedDoors,
      (sprite: unknown, tile: Phaser.Tilemaps.Tile) => {
        // Only check for gold keys if player touched it, not slimes
        if (sprite && (sprite as any).scene && (sprite as any).scene.player &&
          (sprite as any).scene.player.sprite === sprite) {
          // Check if player has a gold key
          if (this.player && this.player.hasGoldKey()) {
            // Consume the gold key
            this.player.useGoldKey();

            // Treat gold locked door like a regular door - break it
            this.doorLayer.putTileAt(
              Graphics.environment.indices.doors.destroyed,
              tile.x,
              tile.y
            );
            this.tileAt(tile.x, tile.y)!.open();
            scene.fov!.recalculate();
          } else {
            // Show feedback when trying to open gold locked door without gold key
            this.showGoldLockedDoorMessage(scene, tile.x, tile.y);
          }
        }
      },
      this
    );

    // Add callback for boss doors
    const bossDoors = [
      Graphics.environment.indices.doors.bossDoor
    ];

    this.doorLayer.setTileIndexCallback(
      bossDoors,
      (sprite: unknown, tile: Phaser.Tilemaps.Tile) => {
        // Only check for boss keys if player touched it, not slimes
        if (sprite && (sprite as any).scene && (sprite as any).scene.player &&
          (sprite as any).scene.player.sprite === sprite) {
          // Check if player has a boss key
          if (this.player && this.player.hasBossKey()) {
            // Consume the boss key
            this.player.useBossKey();

            // Treat boss door like a regular door - break it
            this.doorLayer.putTileAt(
              Graphics.environment.indices.doors.destroyed,
              tile.x,
              tile.y
            );
            this.tileAt(tile.x, tile.y)!.open();
            scene.fov!.recalculate();
          } else {
            // Show feedback when trying to open boss door without boss key
            this.showBossDoorMessage(scene, tile.x, tile.y);
          }
        }
      },
      this
    );

    // Set collision for all doors (including locked ones)
    const allDoors = [
      Graphics.environment.indices.doors.horizontal,
      Graphics.environment.indices.doors.vertical,
      Graphics.environment.indices.doors.lockedHorizontal,
      Graphics.environment.indices.doors.lockedVertical,
      Graphics.environment.indices.doors.goldLockedHorizontal,
      Graphics.environment.indices.doors.goldLockedVertical,
      Graphics.environment.indices.doors.bossDoor
    ];
    this.doorLayer.setCollision(allDoors);
    this.doorLayer.setDepth(3);

    this.wallLayer = this.tilemap.convertLayerToStatic(wallLayer);
    this.wallLayer.setDepth(2);

    // Add torch placement in locked rooms
    this.placeTorchesInLockedRooms();
  }

  // Add method to set player reference
  setPlayer(player: Player) {
    this.player = player;
  }

  tileAt(x: number, y: number): Tile | null {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
      return null;
    }
    return this.tiles[y][x];
  }

  withinRoom(x: number, y: number): boolean {
    return (
      this.rooms.find(r => {
        const { top, left, right, bottom } = r.getBoundingBox();
        return (
          y >= top - 1 && y <= bottom + 1 && x >= left - 1 && x <= right + 1
        );
      }) != undefined
    );
  }

  // Add method to determine which rooms should be locked
  private determineLockedRooms() {
    const roomCount = this.rooms.length;

    // Calculate the absolute maximum possible room size for this dungeon
    const maxPossibleWidth = Math.floor(this.width * 0.8);
    const maxPossibleHeight = Math.floor(this.height * 0.8);
    const maxPossibleSize = maxPossibleWidth * maxPossibleHeight;

    // Find the room that is closest to the absolute maximum size
    let bossRoomIndex = 0;
    let closestToMaxSize = 0;

    for (let i = 0; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const roomSize = room.width * room.height;
      const sizeRatio = roomSize / maxPossibleSize;

      if (sizeRatio > closestToMaxSize) {
        closestToMaxSize = sizeRatio;
        bossRoomIndex = i;
      }
    }

    // Always assign the room closest to maximum size as the boss room
    this.bossLockedRooms.add(bossRoomIndex);

    // Filter for rooms that are big enough for torches (excluding the boss room)
    const eligibleRooms = this.rooms
      .map((room, index) => ({ room, index }))
      .filter(({ room, index }) =>
        room.width >= 6 && room.height >= 6 && index !== bossRoomIndex
      );

    // Ensure we always have at least 1 normal locked room and 1 gold locked room
    const minNormalLocks = 1;
    const minGoldLocks = 1;

    // Calculate how many additional rooms we can lock based on available rooms
    const remainingRooms = eligibleRooms.length;
    const additionalNormalLocks = Math.max(0, Math.floor(remainingRooms * 0.3)); // 30% of remaining rooms
    const additionalGoldLocks = Math.max(0, Math.floor(remainingRooms * 0.1)); // 10% of remaining rooms

    const totalNormalLocks = minNormalLocks + additionalNormalLocks;
    const totalGoldLocks = minGoldLocks + additionalGoldLocks;

    // Shuffle eligible rooms for variety
    for (let i = eligibleRooms.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleRooms[i], eligibleRooms[j]] = [eligibleRooms[j], eligibleRooms[i]];
    }

    // Always assign at least 1 normal locked room
    if (eligibleRooms.length >= 1) {
      this.lockedRooms.add(eligibleRooms[0].index);
    }

    // Always assign at least 1 gold locked room (if we have enough rooms)
    if (eligibleRooms.length >= 2) {
      this.goldLockedRooms.add(eligibleRooms[1].index);
    }

    // Assign additional normal locks (starting from position 2 if we have enough rooms)
    const startIndex = Math.min(2, eligibleRooms.length);
    for (let i = startIndex; i < Math.min(startIndex + totalNormalLocks - 1, eligibleRooms.length); i++) {
      this.lockedRooms.add(eligibleRooms[i].index);
    }

    // Assign additional gold locks (avoiding rooms already assigned)
    let goldLocked = 0;
    const goldStartIndex = startIndex + totalNormalLocks - 1;
    for (let i = goldStartIndex; i < eligibleRooms.length && goldLocked < totalGoldLocks - 1; i++) {
      this.goldLockedRooms.add(eligibleRooms[i].index);
      goldLocked++;
    }
  }

  // Add method to lock doors leading to locked rooms
  private lockRoomDoors() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type === TileType.Door) {
          // Check if this door leads to a locked room
          const leadsToLockedRoom = this.doorLeadsToLockedRoom(x, y);
          if (leadsToLockedRoom === 'normal') {
            this.tiles[y][x] = new Tile(TileType.LockedDoor, x, y, this);
          } else if (leadsToLockedRoom === 'gold') {
            this.tiles[y][x] = new Tile(TileType.GoldLockedDoor, x, y, this);
          } else if (leadsToLockedRoom === 'boss') {
            this.tiles[y][x] = new Tile(TileType.BossDoor, x, y, this);
          }
        }
      }
    }
  }

  // Helper: does this door lead to a locked room?
  private doorLeadsToLockedRoom(x: number, y: number): 'normal' | 'gold' | 'boss' | null {
    // A door is between two rooms/corridors. Check both sides.
    const neighbors = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
      // Find which room (if any) this neighbor is in
      const roomIndex = this.rooms.findIndex(room =>
        nx >= room.x && nx < room.x + room.width &&
        ny >= room.y && ny < room.y + room.height
      );
      if (roomIndex !== -1) {
        if (this.bossLockedRooms && this.bossLockedRooms.has(roomIndex)) return 'boss';
        if (this.goldLockedRooms.has(roomIndex)) return 'gold';
        if (this.lockedRooms.has(roomIndex)) return 'normal';
      }
    }
    return null;
  }

  // Add method to show locked door message
  private showLockedDoorMessage(scene: DungeonScene, tileX: number, tileY: number) {
    const worldX = scene.tilemap!.tileToWorldX(tileX);
    const worldY = scene.tilemap!.tileToWorldY(tileY);

    const text = scene.add.text(
      worldX + Graphics.environment.width / 2,
      worldY - 20,
      ' Locked!',
      {
        fontSize: '12px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    );
    text.setOrigin(0.5);
    text.setDepth(10);

    // Fade out and remove after 1.5 seconds
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 10,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  // Add method to show gold locked door message
  private showGoldLockedDoorMessage(scene: DungeonScene, tileX: number, tileY: number) {
    const worldX = scene.tilemap!.tileToWorldX(tileX);
    const worldY = scene.tilemap!.tileToWorldY(tileY);

    const text = scene.add.text(
      worldX + Graphics.environment.width / 2,
      worldY - 20,
      ' Gold Locked!',
      {
        fontSize: '12px',
        color: '#ffaa00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    );
    text.setOrigin(0.5);
    text.setDepth(10);

    // Fade out and remove after 1.5 seconds
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 10,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  // Add method to show boss door message
  private showBossDoorMessage(scene: DungeonScene, tileX: number, tileY: number) {
    const worldX = scene.tilemap!.tileToWorldX(tileX);
    const worldY = scene.tilemap!.tileToWorldY(tileY);

    const text = scene.add.text(
      worldX + Graphics.environment.width / 2,
      worldY - 20,
      ' Boss Door!',
      {
        fontSize: '12px',
        color: '#ffaa00',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 }
      }
    );
    text.setOrigin(0.5);
    text.setDepth(10);

    // Fade out and remove after 1.5 seconds
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 10,
      duration: 1500,
      onComplete: () => text.destroy()
    });
  }

  // Add method to place torches in locked rooms
  private placeTorchesInLockedRooms() {
    for (let roomIndex = 0; roomIndex < this.rooms.length; roomIndex++) {
      const room = this.rooms[roomIndex];
      const isLocked = this.lockedRooms.has(roomIndex);
      const isGoldLocked = this.goldLockedRooms.has(roomIndex);
      const isBossRoom = this.bossLockedRooms.has(roomIndex);

      if (isLocked || isGoldLocked) {
        // Place torches along all walls
        this.placeTorchesAlongWalls(room);
      }

      // Add special torch placement for boss room entrances
      if (isBossRoom) {
        this.placeTorchesAtBossRoomEntrance(room);
      }
    }

    // Set depth for decoration layer
    this.decorationLayer.setDepth(4);
  }

  // Add method to place torches at boss room entrance
  private placeTorchesAtBossRoomEntrance(bossRoom: Dungeoneer.Room) {
    // Find all doors that lead to the boss room
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (tile.type === TileType.BossDoor) {
          // Place torches around the boss door entrance
          this.placeTorchesAroundDoor(x, y);
        }
      }
    }
  }

  // Add method to place torches around a door
  private placeTorchesAroundDoor(doorX: number, doorY: number) {
    // Define positions around the door to place torches
    const torchPositions = [
      // Adjacent to the door
      { x: doorX - 1, y: doorY },
      { x: doorX + 1, y: doorY },
      { x: doorX, y: doorY - 1 },
      { x: doorX, y: doorY + 1 },
      // Diagonal positions for more dramatic effect
      { x: doorX - 1, y: doorY - 1 },
      { x: doorX + 1, y: doorY - 1 },
      { x: doorX - 1, y: doorY + 1 },
      { x: doorX + 1, y: doorY + 1 },
      // Extended positions for a more dramatic entrance
      { x: doorX - 2, y: doorY },
      { x: doorX + 2, y: doorY },
      { x: doorX, y: doorY - 2 },
      { x: doorX, y: doorY + 2 }
    ];

    // Place torches at valid positions
    for (const pos of torchPositions) {
      if (this.isValidTorchPosition(pos.x, pos.y)) {
        this.decorationLayer.putTileAt(
          Graphics.environment.indices.torch,
          pos.x,
          pos.y
        );
      }
    }
  }

  // Add method to place torches along room walls
  private placeTorchesAlongWalls(room: Dungeoneer.Room) {
    const spacing = 2; // Space between torches

    // Top wall
    for (let x = room.x + 1; x < room.x + room.width - 1; x += spacing) {
      if (this.isValidTorchPosition(x, room.y + 1)) {
        this.decorationLayer.putTileAt(
          Graphics.environment.indices.torch,
          x,
          room.y + 1
        );
      }
    }

    // Bottom wall
    for (let x = room.x + 1; x < room.x + room.width - 1; x += spacing) {
      if (this.isValidTorchPosition(x, room.y + room.height - 2)) {
        this.decorationLayer.putTileAt(
          Graphics.environment.indices.torch,
          x,
          room.y + room.height - 2
        );
      }
    }

    // Left wall
    for (let y = room.y + 1; y < room.y + room.height - 1; y += spacing) {
      if (this.isValidTorchPosition(room.x + 1, y)) {
        this.decorationLayer.putTileAt(
          Graphics.environment.indices.torch,
          room.x + 1,
          y
        );
      }
    }

    // Right wall
    for (let y = room.y + 1; y < room.y + room.height - 1; y += spacing) {
      if (this.isValidTorchPosition(room.x + room.width - 2, y)) {
        this.decorationLayer.putTileAt(
          Graphics.environment.indices.torch,
          room.x + room.width - 2,
          y
        );
      }
    }
  }

  // Helper method to check if a position is valid for torch placement
  private isValidTorchPosition(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return false;
    }

    const tile = this.tiles[y][x];
    // Only place torches on empty floor tiles
    return tile.type === TileType.None;
  }

  // Add public getters for minimap access
  public getLockedRooms(): Set<number> {
    return this.lockedRooms;
  }

  public getGoldLockedRooms(): Set<number> {
    return this.goldLockedRooms;
  }

  public getBossLockedRooms(): Set<number> {
    return this.bossLockedRooms;
  }

  private placeChestInRoom(room: Dungeoneer.Room, roomTL: { x: number, y: number }, roomBounds: { x: number, y: number }) {
    const chestX = Phaser.Math.Between(roomTL.x, roomBounds.x);
    const chestY = Phaser.Math.Between(roomTL.y, roomBounds.y);
    const chest = new Chest(chestX, chestY, this.scene);

    console.log(`Created chest at world position (${chestX}, ${chestY})`);
    this.chests.push(chest);
  }

  // Add method to reset boss key status (for new games)
  static resetBossKeyStatus() {
    Map.bossKeyDropped = false;
  }

  // Add method to check if a position is safe (not on top of an enemy)
  private isPositionSafe(x: number, y: number): boolean {
    const safeDistance = 2; // Minimum distance from enemies in tiles

    for (const slime of this.slimes) {
      const slimeTileX = this.tilemap.worldToTileX(slime.sprite.x);
      const slimeTileY = this.tilemap.worldToTileY(slime.sprite.y);

      const distance = Math.sqrt((x - slimeTileX) ** 2 + (y - slimeTileY) ** 2);

      if (distance < safeDistance) {
        return false; // Too close to an enemy
      }
    }

    return true; // Position is safe
  }
}
