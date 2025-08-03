import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Item from "./Item";
import Player from "./Player";
import DungeonScene from "../scenes/DungeonScene";

export default class Chest {
    private isOpen: boolean = false;
    private items: Item[] = [];
    public sprite: Phaser.Physics.Arcade.Sprite;
    private body: Phaser.Physics.Arcade.Body;
    private scene: Phaser.Scene;
    private nextAction: number;
    private isBossChest: boolean = false; // Add this property

    // Getters for position
    get x(): number { return this.sprite.x; }
    get y(): number { return this.sprite.y; }

    constructor(x: number, y: number, scene: Phaser.Scene, isBossChest: boolean = false) {
        this.scene = scene;
        this.isBossChest = isBossChest; // Store the boss chest flag
        this.sprite = scene.physics.add.sprite(x, y, Graphics.environment.name, Graphics.environment.indices.chest.closed);

        // Make the collision body cover the entire chest sprite
        this.sprite.setSize(16, 16);
        this.sprite.setOffset(0, 0);

        this.sprite.setDepth(10);

        this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
        this.nextAction = 0;
        this.body.bounce.set(0, 0);
        this.body.setImmovable(true);

        // Generate items for the chest (boss chests have special loot)
        this.generateItems(isBossChest);
    }

    private generateItems(isBossChest: boolean = false) {
        if (isBossChest) {
            // Boss chest contains special loot
            const numItems = Phaser.Math.Between(2, 4); // More items for boss chest

            for (let i = 0; i < numItems; i++) {
                const itemType = Phaser.Math.Between(0, 4); // Include boss key
                let item: Item;

                switch (itemType) {
                    case 0:
                        item = Item.createHealthPotion(Phaser.Math.Between(2, 4)); // More potions
                        break;
                    case 1:
                        item = Item.createSpeedPotion(Phaser.Math.Between(2, 4));
                        break;
                    case 2:
                        item = Item.createVisionPotion(Phaser.Math.Between(2, 4));
                        break;
                    case 3:
                        item = Item.createGoldKey(Phaser.Math.Between(1, 3)); // Gold keys
                        break;
                    case 4:
                        item = Item.createBossKey(1); // Boss key
                        break;
                    default:
                        item = Item.createHealthPotion(2);
                }

                this.items.push(item);
            }

            console.log(`Boss chest contains ${this.items.length} special items`);
        } else {
            // Regular chest logic (existing code)
            const numItems = 1;

            for (let i = 0; i < numItems; i++) {
                const itemType = Phaser.Math.Between(0, 3);
                let item: Item;

                switch (itemType) {
                    case 0:
                        item = Item.createSpeedPotion();
                        break;
                    case 1:
                        item = Item.createVisionPotion();
                        break;
                    case 2:
                        item = Item.createHealthPotion();
                        break;
                    default:
                        item = Item.createSpeedPotion();
                }

                this.items.push(item);
            }

            console.log(`Chest contains ${this.items.length} items`);
        }
    }

    openChest() {
        if (this.isOpen) {
            return; // Already opened
        }

        console.log(`=== OPENING CHEST ===`);
        this.isOpen = true;

        // Change sprite to open chest
        this.setFrame(Graphics.environment.indices.chest.open);

        // Get player reference
        const dungeonScene = this.scene as DungeonScene;
        const player = dungeonScene.player;

        if (player && this.items.length > 0) {
            console.log(`Player found! Adding ${this.items.length} items to inventory...`);

            // Add all items to player inventory
            for (const item of this.items) {
                if (player.addItemToInventory(item)) {
                    console.log(`✓ Added ${item.quantity}x ${item.data.name} to inventory`);
                    this.showPickupMessage(item.data.name, item.quantity);
                } else {
                    console.log(`✗ Could not add ${item.data.name} - inventory full`);
                    this.showInventoryFullMessage();
                }
            }

            // Show congratulations message for boss chest
            if (this.isBossChest) {
                this.showCongratulationsMessage();
            }

            // Update inventory display
            const inventoryScene = this.scene.scene.get("InventoryScene");
            if (inventoryScene) {
                inventoryScene.events.emit('updateInventory');
            }
        } else {
            console.log(`✗ ERROR: Could not find player reference!`);
        }

        console.log(`=== CHEST OPENED ===`);
    }

    private setFrame(frame: number) {
        this.sprite.setFrame(frame);
    }

    private showPickupMessage(itemName: string, quantity: number) {
        console.log(`Showing pickup message: +${quantity} ${itemName}`);
        const text = this.scene.add.text(
            this.x,
            this.y - 30,
            `+${quantity} ${itemName}`,
            {
                fontSize: '12px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            }
        );
        text.setOrigin(0.5);
        text.setDepth(10);

        // Fade out and remove after 2 seconds
        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    private showInventoryFullMessage() {
        console.log(`Showing inventory full message`);
        const text = this.scene.add.text(
            this.x,
            this.y - 30,
            'Inventory Full!',
            {
                fontSize: '12px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 4, y: 2 }
            }
        );
        text.setOrigin(0.5);
        text.setDepth(10);

        // Fade out and remove after 2 seconds
        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 20,
            duration: 2000,
            onComplete: () => text.destroy()
        });
    }

    private showCongratulationsMessage() {
        const text = this.scene.add.text(
            this.x,
            this.y - 60, // Position above the pickup messages
            '🎉 CONGRATULATIONS!\nYou beat the game!',
            {
                fontSize: '16px',
                color: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 },
                align: 'center'
            }
        );
        text.setOrigin(0.5);
        text.setDepth(15); // Higher depth to appear above other messages

        // Fade out the congratulations message after 3 seconds
        this.scene.tweens.add({
            targets: text,
            alpha: 0,
            y: text.y - 30,
            duration: 3000,
            onComplete: () => {
                text.destroy();
                this.fadeToTitleScreen();
            }
        });
    }

    private fadeToTitleScreen() {
        // Create a black overlay for the fade effect
        const fadeOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000
        );
        fadeOverlay.setOrigin(0, 0);
        fadeOverlay.setDepth(20); // Very high depth to cover everything
        fadeOverlay.setAlpha(0);

        // Stop all other scenes first
        this.scene.scene.stop('InventoryScene');
        this.scene.scene.stop('MinimapScene');
        this.scene.scene.stop('HealthScene');
        this.scene.scene.stop('TimerScene');
        this.scene.scene.stop('InfoScene');

        // Fade to black over 2 seconds
        this.scene.tweens.add({
            targets: fadeOverlay,
            alpha: 1,
            duration: 2000,
            onComplete: () => {
                // Switch to title screen
                this.scene.scene.start('TitleScene');
            }
        });
    }
}