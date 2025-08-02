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

    // Getters for position
    get x(): number { return this.sprite.x; }
    get y(): number { return this.sprite.y; }

    constructor(x: number, y: number, scene: Phaser.Scene) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, Graphics.environment.name, Graphics.environment.indices.chest.closed);

        // Make the collision body cover the entire chest sprite
        this.sprite.setSize(16, 16); // Increased from 12x10 to 16x16
        this.sprite.setOffset(0, 0); // Adjusted offset to center the collision body

        this.sprite.setDepth(10);

        this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
        this.nextAction = 0;
        this.body.bounce.set(0, 0);
        this.body.setImmovable(true);

        // Generate random items for the chest
        this.generateItems();
    }

    private generateItems() {
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
}