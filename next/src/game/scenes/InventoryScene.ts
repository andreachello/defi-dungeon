import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Player from "../entities/Player";
import Item, { ItemType } from "../entities/Item";

export default class InventoryScene extends Phaser.Scene {
    private player: Player | null = null;
    private background: Phaser.GameObjects.Rectangle;
    private itemSlots: Phaser.GameObjects.Rectangle[] = [];
    private itemSprites: Phaser.GameObjects.Sprite[] = [];
    private itemTexts: Phaser.GameObjects.Text[] = [];
    private hoverTexts: Phaser.GameObjects.Text[] = []; // Add hover text array

    constructor() {
        super({ key: "InventoryScene" });
    }

    create() {
        console.log("InventoryScene created!");

        // Get the game's display dimensions for fixed positioning
        const gameWidth = this.game.scale.width;
        const gameHeight = this.game.scale.height;

        // Calculate rectangle size to fit 10 slots with larger items
        const slotSize = 50; // Back to original size
        const spacing = 10;
        const slotsPerRow = 10;
        const totalSlotsWidth = slotsPerRow * slotSize + (slotsPerRow - 1) * spacing;
        const barWidth = totalSlotsWidth + 40; // Add padding on sides
        const barHeight = 80; // Back to original size

        // Create bottom bar background
        this.background = this.add.rectangle(
            gameWidth / 2,
            gameHeight - 60,
            barWidth,
            barHeight,
            0x000000,
            0.9
        );
        this.background.setStrokeStyle(3, 0xffffff);
        this.background.setDepth(1000);

        // Create inventory title
        const title = this.add.text(
            gameWidth / 2,
            gameHeight - 100,
            "INVENTORY",
            {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        title.setOrigin(0.5);
        title.setDepth(1001);

        // Create inventory slots
        this.createInventorySlots();

        // Listen for inventory update events from other scenes
        this.events.on('updateInventory', this.handleInventoryUpdate, this);

        // Listen for player reference updates
        this.events.on('setPlayer', this.setPlayer, this);

        // Listen for global item used messages
        this.game.events.on('showItemUsedMessage', this.showItemUsedMessage, this);

        // Initial inventory display update
        this.updateInventoryDisplay();
    }

    private setPlayer(player: Player) {
        this.player = player;
        console.log("InventoryScene: Player reference set");

        // Update display immediately when player is set
        this.updateInventoryDisplay();
    }

    private handleInventoryUpdate() {
        console.log("InventoryScene: Received updateInventory event");
        this.updateInventoryDisplay();
    }

    private createInventorySlots() {
        // Get the game's display dimensions for fixed positioning
        const gameWidth = this.game.scale.width;
        const gameHeight = this.game.scale.height;

        // Calculate rectangle size to fit 10 slots (keep original slot size)
        const slotSize = 50; // Back to original size
        const spacing = 10;
        const slotsPerRow = 10;
        const totalSlotsWidth = slotsPerRow * slotSize + (slotsPerRow - 1) * spacing;
        const barWidth = totalSlotsWidth + 40; // Add padding on sides
        const barHeight = 80; // Back to original size

        const barX = gameWidth / 2 - barWidth / 2;
        const barY = gameHeight - 60 - barHeight / 2;

        const startX = barX + 20 + slotSize / 2; // Start after left padding
        const startY = barY + barHeight / 2; // Center vertically within the rectangle

        for (let i = 0; i < slotsPerRow; i++) {
            const x = startX + i * (slotSize + spacing);
            const y = startY;

            // Create slot background (keep original size)
            const slot = this.add.rectangle(x, y, slotSize, slotSize, 0x333333, 0.8);
            slot.setStrokeStyle(2, 0xffffff);
            slot.setDepth(1001);

            // Create item sprite (initially invisible) with MUCH larger scale
            const itemSprite = this.add.sprite(x, y, Graphics.items.name, 0);
            itemSprite.setVisible(false);
            itemSprite.setDepth(1002);
            itemSprite.setScale(3.0); // Much larger scale - items will be 3x bigger

            // Create quantity text with larger font
            const quantityText = this.add.text(x + 18, y + 18, "", { // Keep original position
                fontSize: '12px', // Back to original size
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            });
            quantityText.setOrigin(0.5);
            quantityText.setDepth(1003);

            // Create hover text (initially invisible)
            const hoverText = this.add.text(x, y - 35, "USE", {
                fontSize: '14px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            });
            hoverText.setOrigin(0.5);
            hoverText.setDepth(1004);
            hoverText.setVisible(false);

            // Store references
            this.itemSlots.push(slot);
            this.itemSprites.push(itemSprite);
            this.itemTexts.push(quantityText);
            this.hoverTexts.push(hoverText);

            // Make slot interactive
            slot.setInteractive();
            slot.on('pointerdown', () => {
                const slotIndex = this.itemSlots.indexOf(slot);
                this.useItemInSlot(slotIndex);
            });

            // Add hover effects
            slot.on('pointerover', () => {
                slot.setFillStyle(0x555555, 0.9);

                // Show "USE" text only for potions
                const slotIndex = this.itemSlots.indexOf(slot);
                if (slotIndex < this.itemSprites.length) {
                    const items = this.player?.inventory.getAllItems() || [];
                    if (slotIndex < items.length) {
                        const item = items[slotIndex];
                        if (this.isPotion(item)) {
                            this.hoverTexts[slotIndex].setVisible(true);
                        }
                    }
                }
            });

            slot.on('pointerout', () => {
                slot.setFillStyle(0x333333, 0.8);

                // Hide hover text
                const slotIndex = this.itemSlots.indexOf(slot);
                if (slotIndex < this.hoverTexts.length) {
                    this.hoverTexts[slotIndex].setVisible(false);
                }
            });
        }
    }

    private isPotion(item: Item): boolean {
        return item.data.type === ItemType.SPEED_POTION ||
            item.data.type === ItemType.VISION_POTION ||
            item.data.type === ItemType.HEALTH_POTION ||
            item.data.type === ItemType.MANA_POTION;
    }

    private updateInventoryDisplay() {
        // Try to get player reference if we don't have one
        if (!this.player) {
            const dungeonScene = this.scene.get("DungeonScene") as any;
            if (dungeonScene && dungeonScene.player) {
                this.player = dungeonScene.player;
            } else {
                return;
            }
        }

        const items = this.player.inventory.getAllItems();
        console.log("InventoryScene: Updating display with", items.length, "items");

        // Clear all slots
        this.itemSprites.forEach(sprite => {
            if (sprite && sprite.active) {
                sprite.setVisible(false);
            }
        });
        this.itemTexts.forEach(text => {
            if (text && text.active) {
                text.setText("");
            }
        });
        this.hoverTexts.forEach(text => {
            if (text && text.active) {
                text.setVisible(false);
            }
        });

        // Fill slots with items
        items.forEach((item, index) => {
            if (index < this.itemSprites.length) {
                const sprite = this.itemSprites[index];
                const text = this.itemTexts[index];

                if (sprite && sprite.active) {
                    sprite.setFrame(item.data.spriteIndex);
                    sprite.setVisible(true);
                }

                if (text && text.active && item.quantity > 1) {
                    text.setText(item.quantity.toString());
                }
            }
        });
    }

    private useItemInSlot(slotIndex: number) {
        if (!this.player) return;

        const items = this.player.inventory.getAllItems();
        if (slotIndex < items.length) {
            const item = items[slotIndex];
            if (this.player.useItem(item.data.id)) {
                this.updateInventoryDisplay();

                // Show usage feedback
                this.showItemUsedMessage({ itemName: item.data.name });

                // Emit event to notify other scenes that inventory was used
                this.events.emit('itemUsed', { itemId: item.data.id, itemName: item.data.name });
            }
        }
    }

    private showItemUsedMessage(data: { itemName: string }) {
        // Get the game's display dimensions for fixed positioning
        const gameWidth = this.game.scale.width;
        const gameHeight = this.game.scale.height;

        const text = this.add.text(
            gameWidth / 2,
            gameHeight - 120,
            `Used ${data.itemName}!`,
            {
                fontSize: '16px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        text.setOrigin(0.5);
        text.setDepth(2000);

        // Fade out and remove after 1.5 seconds
        this.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 1500,
            onComplete: () => text.destroy()
        });
    }

    // Public method to refresh inventory display
    public refreshInventory() {
        this.updateInventoryDisplay();
    }
} 