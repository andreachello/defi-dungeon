import Phaser from "phaser";

export default class GasPriceScene extends Phaser.Scene {
    private gasPriceText: Phaser.GameObjects.Text;
    private gasPriceBackground: Phaser.GameObjects.Rectangle;
    private gasIcon: Phaser.GameObjects.Sprite;
    private updateTimer: Phaser.Time.TimerEvent | null = null;
    private isInBossRoom: boolean = false; // Add this property

    // Gas price UI configuration - updated to match other boxes
    private readonly gasPriceWidth = 250; // Changed from 200 to 250
    private readonly gasPriceHeight = 50; // Changed from 40 to 50
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.8;
    private readonly borderColor = 0xffff00;
    private readonly borderWidth = 2;

    // Heart positioning constants (matching other scenes)
    private readonly heartSize = 16;
    private readonly heartSpacing = 15;
    private readonly heartScale = 1.5;
    private readonly heartStartX = 60;
    private readonly heartStartY = 30;

    constructor() {
        super({ key: "GasPriceScene" });
    }

    create(): void {
        console.log("GasPriceScene created!");

        // Calculate position below hearts
        const heartBottomY = this.heartStartY + (this.heartSize * this.heartScale) / 2;
        const gasPriceY = heartBottomY + 25; // 25 pixels below hearts
        const gasPriceX = 30; // Moved to the left (was this.heartStartX which is 60)

        // Create background
        this.gasPriceBackground = this.add.rectangle(
            gasPriceX + this.gasPriceWidth / 2,
            gasPriceY + this.gasPriceHeight / 2,
            this.gasPriceWidth,
            this.gasPriceHeight,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.gasPriceBackground.setDepth(1000);
        this.gasPriceBackground.setStrokeStyle(this.borderWidth, this.borderColor);
        this.gasPriceBackground.setVisible(false); // Start hidden

        // Create gas icon (using a flame-like sprite from items)
        this.gasIcon = this.add.sprite(
            gasPriceX + 25,
            gasPriceY + this.gasPriceHeight / 2,
            'items',
            2 // Using item sprite index 2 as gas icon
        );
        this.gasIcon.setScale(1.0);
        this.gasIcon.setDepth(1001);
        this.gasIcon.setVisible(false); // Start hidden

        // Create gas price text
        this.gasPriceText = this.add.text(
            gasPriceX + 50,
            gasPriceY + this.gasPriceHeight / 2,
            'Loading...',
            {
                fontSize: '14px',
                color: '#ffff00',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.gasPriceText.setOrigin(0, 0.5);
        this.gasPriceText.setDepth(1001);
        this.gasPriceText.setVisible(false); // Start hidden

        // Listen for boss room events
        this.game.events.on('playerEnteredBossRoom', this.onPlayerEnteredBossRoom, this);
        this.game.events.on('playerLeftBossRoom', this.onPlayerLeftBossRoom, this);

        // Start updating gas price
        this.updateGasPrice();
        this.startGasPriceUpdates();

        console.log("GasPriceScene setup completed");
    }

    private async updateGasPrice(): Promise<void> {
        try {
            const response = await fetch('/api/1inch/gas-price?chainId=1');
            if (!response.ok) {
                throw new Error(`Failed to fetch gas price: ${response.statusText}`);
            }

            const gasData = await response.json();
            const gasPriceGwei = (gasData.fast / 1e9).toFixed(1); // Convert to Gwei

            if (this.gasPriceText) {
                this.gasPriceText.setText(`${gasPriceGwei} Gwei`);

                // Color coding based on gas price
                const gasPrice = parseFloat(gasPriceGwei);
                if (gasPrice < 20) {
                    this.gasPriceText.setColor('#00ff00'); // Green for low gas
                } else if (gasPrice < 50) {
                    this.gasPriceText.setColor('#ffff00'); // Yellow for medium gas
                } else {
                    this.gasPriceText.setColor('#ff0000'); // Red for high gas
                }
            }

            console.log(`Gas price updated: ${gasPriceGwei} Gwei`);
        } catch (error) {
            console.error('Failed to update gas price:', error);
            if (this.gasPriceText) {
                this.gasPriceText.setText('Error');
                this.gasPriceText.setColor('#ff0000');
            }
        }
    }

    private startGasPriceUpdates(): void {
        // Update gas price every 30 seconds
        this.updateTimer = this.time.addEvent({
            delay: 30000, // 30 seconds
            callback: this.updateGasPrice,
            callbackScope: this,
            loop: true
        });
    }

    private onPlayerEnteredBossRoom(): void {
        console.log("GasPriceScene: Player entered boss room");
        this.isInBossRoom = true;
        this.showGasPrice();
    }

    private onPlayerLeftBossRoom(): void {
        console.log("GasPriceScene: Player left boss room");
        this.isInBossRoom = false;
        this.hideGasPrice();
    }

    private showGasPrice(): void {
        if (this.gasPriceBackground) this.gasPriceBackground.setVisible(true);
        if (this.gasIcon) this.gasIcon.setVisible(true);
        if (this.gasPriceText) this.gasPriceText.setVisible(true);
    }

    private hideGasPrice(): void {
        if (this.gasPriceBackground) this.gasPriceBackground.setVisible(false);
        if (this.gasIcon) this.gasIcon.setVisible(false);
        if (this.gasPriceText) this.gasPriceText.setVisible(false);
    }

    destroy(): void {
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        // super.destroy();
    }
} 