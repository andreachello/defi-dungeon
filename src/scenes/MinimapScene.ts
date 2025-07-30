import Phaser from "phaser";
import Map from "../entities/Map";
import Player from "../entities/Player";
import { TileType } from "../entities/Tile";

export default class MinimapScene extends Phaser.Scene {
    private map: Map | null = null;
    private player: Player | null = null;
    private background: Phaser.GameObjects.Rectangle;
    private minimapGraphics: Phaser.GameObjects.Graphics;
    private playerDot: Phaser.GameObjects.Graphics;
    private title: Phaser.GameObjects.Text;

    // Minimap configuration
    private readonly minimapSize = 250;
    private readonly padding = 20;
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.9;
    private readonly borderColor = 0xffffff;
    private readonly borderWidth = 3;

    // Colors for different elements
    private readonly roomColor = 0x666666;
    private readonly wallColor = 0x333333;
    private readonly doorColor = 0x888888;
    private readonly lockedDoorColor = 0xff0000;
    private readonly goldLockedDoorColor = 0xffaa00;
    private readonly bossDoorColor = 0xff00ff;
    private readonly playerColor = 0x00ff00;

    constructor() {
        super({ key: "MinimapScene" });
    }

    create() {
        console.log("MinimapScene created!");

        // Create background
        const gameWidth = this.game.scale.width;
        const xPos = gameWidth - this.minimapSize - this.padding * 2;
        const yPos = this.padding * 2;

        this.background = this.add.rectangle(
            xPos - this.padding - 80, // Extra width for legend
            yPos - this.padding,
            this.minimapSize + this.padding * 2 + 80, // Extra width for legend
            this.minimapSize + this.padding * 2,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.background.setDepth(1000);

        // Create title
        this.title = this.add.text(
            xPos + this.minimapSize / 2,
            yPos + 15,
            'MINIMAP',
            {
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.title.setOrigin(0.5);
        this.title.setDepth(1001);

        // Create legend to the left of minimap
        this.createLegend(xPos - 100, yPos + 30);

        // Create graphics for drawing the minimap
        this.minimapGraphics = this.add.graphics();
        this.minimapGraphics.setDepth(1001);

        // Create player dot
        this.playerDot = this.add.graphics();
        this.playerDot.setDepth(1002);

        // Listen for map and player reference updates
        this.events.on('setMap', this.setMap, this);
        this.events.on('setPlayer', this.setPlayer, this);
        this.events.on('updateMinimap', this.updateMinimap, this);

        console.log("MinimapScene setup completed");
    }

    private createLegend(xPos: number, yPos: number): void {
        const legendItems = [
            { color: 0xff00ff, label: 'BOSS ROOM' },
            { color: 0xffaa00, label: 'GOLD LOCKED' },
            { color: 0xff0000, label: 'LOCKED ROOM' },
            { color: 0x666666, label: 'NORMAL ROOM' }
        ];

        const itemHeight = 15;
        const itemSpacing = 5;
        const boxSize = 10;

        legendItems.forEach((item, index) => {
            const itemY = yPos + index * (itemHeight + itemSpacing);

            // Draw color box
            this.add.rectangle(
                xPos,
                itemY + itemHeight / 2,
                boxSize,
                boxSize,
                item.color
            ).setDepth(1001);

            // Draw label
            this.add.text(
                xPos + 15,
                itemY + itemHeight / 2,
                item.label,
                {
                    fontSize: '10px',
                    color: '#ffffff'
                }
            ).setOrigin(0, 0.5).setDepth(1001);
        });
    }

    private setMap(map: Map) {
        console.log("Setting map in MinimapScene");
        this.map = map;
        this.drawMinimap();
    }

    private setPlayer(player: Player) {
        console.log("Setting player in MinimapScene");
        this.player = player;
    }

    private updateMinimap() {
        if (this.map && this.player) {
            this.updatePlayerPosition();
        }
    }

    private drawMinimap(): void {
        if (!this.map) return;

        console.log("Drawing minimap...");
        this.minimapGraphics.clear();

        const gameWidth = this.game.scale.width;
        const xPos = gameWidth - this.minimapSize - this.padding * 2;
        const yPos = this.padding * 2 + 30; // Below title

        const scaleX = this.minimapSize / this.map.width;
        const scaleY = this.minimapSize / this.map.height;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = xPos + (this.minimapSize - this.map.width * scale) / 2;
        const offsetY = yPos + (this.minimapSize - this.map.height * scale) / 2;

        console.log(`Map size: ${this.map.width}x${this.map.height}, Scale: ${scale}`);

        // Draw rooms
        console.log(`Drawing ${this.map.rooms.length} rooms...`);
        for (const room of this.map.rooms) {
            const roomIndex = this.map.rooms.indexOf(room);
            const isLocked = this.map.getLockedRooms().has(roomIndex);
            const isGoldLocked = this.map.getGoldLockedRooms().has(roomIndex);
            const isBossRoom = this.map.getBossLockedRooms().has(roomIndex);

            let roomColor = this.roomColor;
            if (isBossRoom) {
                roomColor = 0xff00ff; // Purple for boss rooms
            } else if (isGoldLocked) {
                roomColor = 0xffaa00; // Orange for gold locked rooms
            } else if (isLocked) {
                roomColor = 0xff0000; // Red for locked rooms
            }

            this.minimapGraphics.fillStyle(roomColor, 0.8);
            this.minimapGraphics.fillRect(
                offsetX + room.x * scale,
                offsetY + room.y * scale,
                room.width * scale,
                room.height * scale
            );

        }

        // Draw walls and doors
        console.log("Drawing walls and doors...");
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.map.tiles[y][x];
                const pixelX = offsetX + x * scale;
                const pixelY = offsetY + y * scale;

                if (tile.type === TileType.Wall) {
                    this.minimapGraphics.fillStyle(this.wallColor, 1);
                    this.minimapGraphics.fillRect(pixelX, pixelY, scale, scale);
                } else if (tile.type === TileType.Door) {
                    this.minimapGraphics.fillStyle(this.doorColor, 1);
                    this.minimapGraphics.fillRect(pixelX, pixelY, scale, scale);
                } else if (tile.type === TileType.LockedDoor) {
                    this.minimapGraphics.fillStyle(this.lockedDoorColor, 1);
                    this.minimapGraphics.fillRect(pixelX, pixelY, scale, scale);
                } else if (tile.type === TileType.GoldLockedDoor) {
                    this.minimapGraphics.fillStyle(this.goldLockedDoorColor, 1);
                    this.minimapGraphics.fillRect(pixelX, pixelY, scale, scale);
                } else if (tile.type === TileType.BossDoor) {
                    this.minimapGraphics.fillStyle(this.bossDoorColor, 1);
                    this.minimapGraphics.fillRect(pixelX, pixelY, scale, scale);
                }
            }
        }
        console.log("Minimap drawing completed");
    }

    private updatePlayerPosition(): void {
        if (!this.map || !this.player) return;

        this.playerDot.clear();

        const gameWidth = this.game.scale.width;
        const xPos = gameWidth - this.minimapSize - this.padding * 2;
        const yPos = this.padding * 2 + 30; // Below title

        const scaleX = this.minimapSize / this.map.width;
        const scaleY = this.minimapSize / this.map.height;
        const scale = Math.min(scaleX, scaleY);

        const offsetX = xPos + (this.minimapSize - this.map.width * scale) / 2;
        const offsetY = yPos + (this.minimapSize - this.map.height * scale) / 2;

        // Convert player world position to tile coordinates
        const playerTileX = this.map.tilemap!.worldToTileX(this.player.sprite.x);
        const playerTileY = this.map.tilemap!.worldToTileY(this.player.sprite.y);

        // Draw player dot
        this.playerDot.fillStyle(this.playerColor, 1);
        this.playerDot.fillCircle(
            offsetX + playerTileX * scale + scale / 2,
            offsetY + playerTileY * scale + scale / 2,
            Math.max(2, scale / 3)
        );
    }
} 