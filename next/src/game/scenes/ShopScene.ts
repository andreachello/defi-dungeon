import Phaser from "phaser";
import Fonts from "../assets/Fonts";
import Graphics from "../assets/Graphics";

interface ShopItem {
    name: string;
    description: string;
    price: number;
    spriteIndex: number;
    type: 'potion' | 'scroll' | 'weapon';
}

export default class ShopScene extends Phaser.Scene {
    private background?: Phaser.GameObjects.Rectangle;
    private titleText?: Phaser.GameObjects.DynamicBitmapText;
    private backButton?: Phaser.GameObjects.Rectangle;
    private backButtonText?: Phaser.GameObjects.DynamicBitmapText;
    private shopItems: ShopItem[] = [];
    private itemSprites: Phaser.GameObjects.Sprite[] = [];
    private itemTexts: Phaser.GameObjects.DynamicBitmapText[] = [];
    private buyButtons: Phaser.GameObjects.Rectangle[] = [];
    private buyButtonTexts: Phaser.GameObjects.DynamicBitmapText[] = [];
    private playerGold: number = 100; // Starting gold
    private goldText?: Phaser.GameObjects.DynamicBitmapText;

    constructor() {
        super({ key: "ShopScene" });
    }

    preload(): void {
        this.load.bitmapFont("default", ...Fonts.default);

        // Load items spritesheet
        this.load.spritesheet(Graphics.items.name, Graphics.items.file, {
            frameWidth: Graphics.items.width,
            frameHeight: Graphics.items.height
        });
    }

    create(): void {
        const { width, height } = this.scale;

        // Create dark background
        this.background = this.add.rectangle(0, 0, width, height, 0x000000, 0.9);
        this.background.setOrigin(0, 0);

        // Create title
        this.titleText = this.add.dynamicBitmapText(
            width / 2,
            50,
            "default",
            "POTION SHOP",
            24
        );
        this.titleText.setOrigin(0.5);
        this.titleText.setTint(0xff6b35);

        // Create back button
        this.createBackButton();

        // Create gold display
        this.createGoldDisplay();

        // Initialize shop items
        this.initializeShopItems();

        // Create shop UI
        this.createShopUI();
    }

    private createBackButton(): void {
        const { width, height } = this.scale;

        this.backButton = this.add.rectangle(
            100,
            50,
            120,
            40,
            0x333333,
            0.8
        );
        this.backButton.setStrokeStyle(2, 0xff6b35);
        this.backButton.setInteractive();

        this.backButtonText = this.add.dynamicBitmapText(
            100,
            50,
            "default",
            "BACK",
            14
        );
        this.backButtonText.setOrigin(0.5);
        this.backButtonText.setTint(0xffffff);

        // Add hover effects
        this.backButton.on('pointerover', () => {
            this.backButton?.setStrokeStyle(3, 0xff8c42);
        });

        this.backButton.on('pointerout', () => {
            this.backButton?.setStrokeStyle(2, 0xff6b35);
        });

        this.backButton.on('pointerdown', () => {
            this.scene.start("TitleScene");
        });
    }

    private createGoldDisplay(): void {
        const { width } = this.scale;

        this.goldText = this.add.dynamicBitmapText(
            width - 150,
            50,
            "default",
            `GOLD: ${this.playerGold}`,
            16
        );
        this.goldText.setOrigin(0.5);
        this.goldText.setTint(0xffd700);
    }

    private initializeShopItems(): void {
        this.shopItems = [
            {
                name: "Health Potion",
                description: "Restores 2 full hearts",
                price: 15,
                spriteIndex: 0x02,
                type: 'potion'
            },
            {
                name: "Speed Potion",
                description: "Increases movement speed for 30 seconds",
                price: 20,
                spriteIndex: 0x03,
                type: 'potion'
            },
            {
                name: "Vision Potion",
                description: "Increases vision range for 2 seconds",
                price: 25,
                spriteIndex: 0x04,
                type: 'potion'
            }
        ];
    }

    private createShopUI(): void {
        const { width, height } = this.scale;
        const startY = 120;
        const itemHeight = 160;
        const itemsPerRow = 1; // Changed from 2 to 1 for single column layout

        this.shopItems.forEach((item, index) => {
            const row = index; // Each item gets its own row
            const col = 0; // Only one column
            const x = width / 2; // Center horizontally
            const y = startY + row * itemHeight;

            // Create item background
            const itemBackground = this.add.rectangle(
                x,
                y,
                450,
                70,
                0x222222,
                0.7
            );
            itemBackground.setStrokeStyle(1, 0x444444);

            // Create item sprite
            const itemSprite = this.add.sprite(
                x - 170,
                y,
                Graphics.items.name,
                item.spriteIndex
            );
            itemSprite.setScale(2);
            this.itemSprites.push(itemSprite);

            // Create item name
            const itemName = this.add.dynamicBitmapText(
                x - 120,
                y - 15,
                "default",
                item.name,
                14
            );
            itemName.setTint(0xffffff);
            this.itemTexts.push(itemName);

            // Create item description
            const itemDesc = this.add.dynamicBitmapText(
                x - 120,
                y + 5,
                "default",
                item.description,
                10
            );
            itemDesc.setTint(0xcccccc);
            this.itemTexts.push(itemDesc);

            // Create price text
            const priceText = this.add.dynamicBitmapText(
                x - 210,
                y + 70,
                "default",
                `${item.price} G`,
                12
            );
            priceText.setTint(0xffd700);
            this.itemTexts.push(priceText);

            // Create buy button
            const buyButton = this.add.rectangle(
                x + 210,
                y + 70,
                100,
                35,
                0x333333,
                0.8
            );
            buyButton.setStrokeStyle(1, 0xff6b35);
            buyButton.setInteractive();
            this.buyButtons.push(buyButton);

            const buyButtonText = this.add.dynamicBitmapText(
                x + 210,
                y + 70,
                "default",
                "BUY",
                12
            );
            buyButtonText.setOrigin(0.5);
            buyButtonText.setTint(0xffffff);
            this.buyButtonTexts.push(buyButtonText);

            // Add hover effects
            buyButton.on('pointerover', () => {
                buyButton.setStrokeStyle(2, 0xff8c42);
                buyButtonText.setTint(0xffffff);
            });

            buyButton.on('pointerout', () => {
                buyButton.setStrokeStyle(1, 0xff6b35);
                buyButtonText.setTint(0xffffff);
            });

            buyButton.on('pointerdown', () => {
                this.buyItem(index);
            });
        });
    }

    private buyItem(itemIndex: number): void {
        const item = this.shopItems[itemIndex];

        if (this.playerGold >= item.price) {
            this.playerGold -= item.price;
            this.updateGoldDisplay();

            // Add visual feedback
            this.showPurchaseEffect(itemIndex);

            // Here you would typically add the item to the player's inventory
            console.log(`Bought ${item.name} for ${item.price} gold`);
        } else {
            this.showInsufficientFundsMessage();
        }
    }

    private showPurchaseEffect(itemIndex: number): void {
        const button = this.buyButtons[itemIndex];
        const buttonText = this.buyButtonTexts[itemIndex];

        // Flash green
        button.setFillStyle(0x00ff00, 0.8);
        buttonText.setText("SOLD!");

        // Reset after 1 second
        this.time.delayedCall(1000, () => {
            button.setFillStyle(0x333333, 0.8);
            buttonText.setText("BUY");
        });
    }

    private showInsufficientFundsMessage(): void {
        const { width, height } = this.scale;

        const message = this.add.dynamicBitmapText(
            width / 2,
            height - 100,
            "default",
            "Not enough gold!",
            16
        );
        message.setOrigin(0.5);
        message.setTint(0xff0000);

        // Remove message after 2 seconds
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
    }

    private updateGoldDisplay(): void {
        if (this.goldText) {
            this.goldText.setText(`GOLD: ${this.playerGold}`);
        }
    }
} 