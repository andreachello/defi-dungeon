import Dungeoneer from "dungeoneer";
import Tile, { TileType } from "./Tile";
import Slime from "./Slime";
import Graphics from "../assets/Graphics";
import DungeonScene from "../scenes/DungeonScene";
import Player from "./Player";

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

  public readonly rooms: Dungeoneer.Room[];

  // Add room locking properties
  private lockedRooms: Set<number> = new Set();
  private goldLockedRooms: Set<number> = new Set();
  private bossLockedRooms: Set<number> = new Set(); // Add boss rooms set

  // Add player reference
  private player: Player | null = null;

  constructor(width: number, height: number, scene: DungeonScene) {
    const dungeon = Dungeoneer.build({
      width: width,
      height: height
    });
    this.rooms = dungeon.rooms;

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

    // Choose starting room (must be unlocked)
    const unlockedRooms = this.rooms.filter((_, index) =>
      !this.lockedRooms.has(index) && !this.goldLockedRooms.has(index)
    );
    const roomNumber = Math.floor(Math.random() * unlockedRooms.length);
    const firstRoom = unlockedRooms[roomNumber];
    this.startingX = Math.floor(firstRoom.x + firstRoom.width / 2);
    this.startingY = Math.floor(firstRoom.y + firstRoom.height / 2);

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

    for (let room of dungeon.rooms) {
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
      const roomIndex = this.rooms.indexOf(room);
      const isLocked = this.lockedRooms.has(roomIndex);
      const isGoldLocked = this.goldLockedRooms.has(roomIndex);
      const isBossRoom = this.bossLockedRooms.has(roomIndex);

      const roomTL = this.tilemap.tileToWorldXY(room.x + 1, room.y + 1);
      const roomBounds = this.tilemap.tileToWorldXY(
        room.x + room.width - 1,
        room.y + room.height - 1
      );

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
          (slime as any).dropsBossKey = true;
        } else if (isGoldLocked) {
          (slime as any).dropsBossKey = true;
        } else if (isLocked) {
          (slime as any).dropsGoldKey = true;
        }

        this.slimes.push(slime);
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
      (_: unknown, tile: Phaser.Tilemaps.Tile) => {
        // Regular door behavior - always break
        this.doorLayer.putTileAt(
          Graphics.environment.indices.doors.destroyed,
          tile.x,
          tile.y
        );
        this.tileAt(tile.x, tile.y)!.open();
        scene.fov!.recalculate();
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
      (_: unknown, tile: Phaser.Tilemaps.Tile) => {
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
      },
      this
    );

    const goldLockedDoors = [
      Graphics.environment.indices.doors.goldLockedHorizontal,
      Graphics.environment.indices.doors.goldLockedVertical
    ];

    this.doorLayer.setTileIndexCallback(
      goldLockedDoors,
      (_: unknown, tile: Phaser.Tilemaps.Tile) => {
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
      },
      this
    );

    // Add callback for boss doors
    const bossDoors = [
      Graphics.environment.indices.doors.bossDoor
    ];

    this.doorLayer.setTileIndexCallback(
      bossDoors,
      (_: unknown, tile: Phaser.Tilemaps.Tile) => {
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

    // Filter for rooms that are big enough for torches
    const eligibleRooms = this.rooms
      .map((room, index) => ({ room, index }))
      .filter(({ room }) => room.width >= 6 && room.height >= 6); // Minimum size for locked rooms

    const eligibleCount = eligibleRooms.length;
    const normalLockCount = Math.floor(eligibleCount * 0.4); // 30% of eligible rooms
    const goldLockCount = Math.floor(eligibleCount * 0.1); // 10% of eligible rooms

    // Shuffle eligible rooms
    for (let i = eligibleRooms.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleRooms[i], eligibleRooms[j]] = [eligibleRooms[j], eligibleRooms[i]];
    }

    // Always assign 1 boss room first
    this.bossLockedRooms.add(eligibleRooms[0].index);

    // Assign normal locks (skip the first room since it's the boss room)
    for (let i = 1; i < Math.min(1 + normalLockCount, eligibleRooms.length); i++) {
      this.lockedRooms.add(eligibleRooms[i].index);
    }

    // Assign gold locks (avoiding rooms already assigned)
    let goldLocked = 0;
    for (let i = 1 + normalLockCount; i < eligibleRooms.length && goldLocked < goldLockCount; i++) {
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
}
