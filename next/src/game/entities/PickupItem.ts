import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Item from "./Item";
import Player from "./Player";

export default class PickupItem extends Phaser.GameObjects.Sprite {
    private item: Item;

    constructor(x: number, y: number, scene: Phaser.Scene, item: Item) {
        super(scene, x, y, Graphics.items.name, item.data.spriteIndex);
        this.setOrigin(0.5, 0.5);
        this.setDepth(5);
        this.item = item;

        console.log(`Created PickupItem: ${item.data.name} at position (${x}, ${y})`);

        // Add physics body for collision detection
        scene.physics.add.existing(this);
        (this.body as any).setSize(16, 16); // Set collision size
        (this.body as any).setOffset(0, 0);
        (this.body as any).setImmovable(true); // Make it immovable so player can pass through

        // Add a subtle floating animation
        this.scene.tweens.add({
            targets: this,
            y: this.y - 2,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    pickupItem() {
        console.log(`=== PICKUP ITEM DEBUG ===`);
        console.log(`Player touched: ${this.item.data.name}`);
        console.log(`Item quantity: ${this.item.quantity}`);
        console.log(`Item sprite index: ${this.item.data.spriteIndex}`);

        // Try multiple ways to get the player
        let player: Player | null = null;

        // Method 1: Try to get from DungeonScene
        console.log(`Trying to get player from DungeonScene...`);
        const dungeonScene = this.scene.scene.get("DungeonScene") as any;
        if (dungeonScene && dungeonScene.player) {
            player = dungeonScene.player;
            console.log(`✓ Found player in DungeonScene`);
        } else {
            console.log(`✗ No player found in DungeonScene`);
        }

        // Method 2: Try to get from current scene
        if (!player && (this.scene as any).player) {
            player = (this.scene as any).player;
            console.log(`✓ Found player in current scene`);
        }

        if (player) {
            console.log(`Player found! Attempting to add item to inventory...`);
            console.log(`Player inventory before: ${player.inventory.getAllItems().length} items`);

            if (player.addItemToInventory(this.item)) {
                console.log(`✓ SUCCESS: Added ${this.item.quantity}x ${this.item.data.name} to inventory`);
                console.log(`Player inventory after: ${player.inventory.getAllItems().length} items`);

                // Show pickup message
                this.showPickupMessage(this.item.data.name, this.item.quantity);

                // Update inventory display by emitting event to DungeonScene
                if (dungeonScene) {
                    console.log(`Emitting inventoryUpdated event to DungeonScene`);
                    dungeonScene.events.emit('inventoryUpdated');
                }

                // Also try to update inventory scene directly
                const inventoryScene = this.scene.scene.get("InventoryScene");
                if (inventoryScene) {
                    console.log(`Emitting updateInventory event to InventoryScene`);
                    inventoryScene.events.emit('updateInventory');
                }
            } else {
                console.log(`✗ FAILED: Could not add ${this.item.data.name} - inventory full`);
                this.showInventoryFullMessage();
            }
        } else {
            console.log(`✗ ERROR: Could not find player reference!`);
        }

        console.log(`=== END PICKUP DEBUG ===`);

        // Remove the item after pickup
        this.destroy();
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
} 