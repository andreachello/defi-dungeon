import Phaser from "phaser";
import Player from "../entities/Player";

export default class TimerScene extends Phaser.Scene {
    private player: Player | null = null;
    private background: Phaser.GameObjects.Rectangle;
    private timerText: Phaser.GameObjects.Text;
    private title: Phaser.GameObjects.Text;
    private speedIcon: Phaser.GameObjects.Sprite;
    private countdownText: Phaser.GameObjects.Text;

    // Vision boost properties
    private visionBackground: Phaser.GameObjects.Rectangle;
    private visionTitle: Phaser.GameObjects.Text;
    private visionIcon: Phaser.GameObjects.Sprite;
    private visionCountdownText: Phaser.GameObjects.Text;
    private visionTimerText: Phaser.GameObjects.Text;

    // Timer configuration
    private readonly timerWidth = 250;
    private readonly timerHeight = 60;
    private readonly padding = 15;
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.9;
    private readonly borderColor = 0x00ff00;
    private readonly visionBorderColor = 0x0000ff; // Blue for vision
    private readonly borderWidth = 2;

    // Countdown properties
    private speedBoostStartTime: number = 0;
    private speedBoostDuration: number = 0;
    private lastDisplayedSeconds: number = 0;
    private updateTimer: Phaser.Time.TimerEvent | null = null;

    // Vision boost properties
    private visionBoostStartTime: number = 0;
    private visionBoostDuration: number = 0;
    private lastVisionSeconds: number = 0;
    private visionUpdateTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super({ key: "TimerScene" });
    }

    create() {
        console.log("TimerScene created!");

        // Create speed boost timer
        this.createSpeedBoostTimer();

        // Create vision boost timer
        this.createVisionBoostTimer();

        // Listen for player reference updates and boost events
        this.events.on('setPlayer', this.setPlayer, this);
        this.events.on('speedBoostActivated', this.onSpeedBoostActivated, this);
        this.events.on('speedBoostExpired', this.onSpeedBoostExpired, this);
        this.events.on('visionBoostActivated', this.onVisionBoostActivated, this);
        this.events.on('visionBoostExpired', this.onVisionBoostExpired, this);

        console.log("TimerScene setup completed");
    }

    private createSpeedBoostTimer() {
        const xPos = this.padding * 2;
        const yPos = this.padding * 2;

        this.background = this.add.rectangle(
            xPos,
            yPos,
            this.timerWidth,
            this.timerHeight,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.background.setDepth(1000);
        this.background.setVisible(false);

        this.speedIcon = this.add.sprite(
            xPos + 30,
            yPos + this.timerHeight / 2,
            'items',
            3
        );
        this.speedIcon.setScale(1.2);
        this.speedIcon.setDepth(1001);
        this.speedIcon.setVisible(false);

        this.title = this.add.text(
            xPos + 70,
            yPos + this.timerHeight / 2,
            'SPEED BOOST',
            {
                fontSize: '14px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.title.setOrigin(0, 0.5);
        this.title.setDepth(1001);
        this.title.setVisible(false);

        this.countdownText = this.add.text(
            xPos + 180,
            yPos + this.timerHeight / 2,
            '30',
            {
                fontSize: '20px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        this.countdownText.setOrigin(0, 0.5);
        this.countdownText.setDepth(1001);
        this.countdownText.setVisible(false);

        this.timerText = this.add.text(
            xPos + 180,
            yPos + this.timerHeight - 8,
            's',
            {
                fontSize: '10px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 2, y: 1 }
            }
        );
        this.timerText.setOrigin(0, 0.5);
        this.timerText.setDepth(1001);
        this.timerText.setVisible(false);
    }

    private createVisionBoostTimer() {
        const xPos = this.padding * 2;
        const yPos = this.padding * 2 + this.timerHeight + 10; // Below speed boost timer

        this.visionBackground = this.add.rectangle(
            xPos,
            yPos,
            this.timerWidth,
            this.timerHeight,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.visionBackground.setDepth(1000);
        this.visionBackground.setVisible(false);

        this.visionIcon = this.add.sprite(
            xPos + 30,
            yPos + this.timerHeight / 2,
            'items',
            4 // Vision potion sprite index
        );
        this.visionIcon.setScale(1.2);
        this.visionIcon.setDepth(1001);
        this.visionIcon.setVisible(false);

        this.visionTitle = this.add.text(
            xPos + 70,
            yPos + this.timerHeight / 2,
            'VISION BOOST',
            {
                fontSize: '14px',
                color: '#0000ff',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.visionTitle.setOrigin(0, 0.5);
        this.visionTitle.setDepth(1001);
        this.visionTitle.setVisible(false);

        this.visionCountdownText = this.add.text(
            xPos + 180,
            yPos + this.timerHeight / 2,
            '30',
            {
                fontSize: '20px',
                color: '#0000ff',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        this.visionCountdownText.setOrigin(0, 0.5);
        this.visionCountdownText.setDepth(1001);
        this.visionCountdownText.setVisible(false);

        this.visionTimerText = this.add.text(
            xPos + 180,
            yPos + this.timerHeight - 8,
            's',
            {
                fontSize: '10px',
                color: '#0000ff',
                backgroundColor: '#000000',
                padding: { x: 2, y: 1 }
            }
        );
        this.visionTimerText.setOrigin(0, 0.5);
        this.visionTimerText.setDepth(1001);
        this.visionTimerText.setVisible(false);
    }

    private setPlayer(player: Player) {
        console.log("Setting player in TimerScene");
        this.player = player;
    }

    private onSpeedBoostActivated(data: { duration: number }) {
        console.log("Speed boost activated in TimerScene! Duration:", data.duration);
        this.speedBoostStartTime = this.time.now;
        this.speedBoostDuration = data.duration;
        this.lastDisplayedSeconds = Math.ceil(data.duration / 1000);

        this.showSpeedTimer();
        this.updateSpeedCountdownDisplay();

        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        this.updateTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateSpeedCountdownDisplay,
            callbackScope: this,
            loop: true
        });
    }

    private onSpeedBoostExpired() {
        console.log("Speed boost expired in TimerScene!");
        this.hideSpeedTimer();

        if (this.updateTimer) {
            this.updateTimer.destroy();
            this.updateTimer = null;
        }
    }

    private onVisionBoostActivated(data: { duration: number }) {
        console.log("Vision boost activated in TimerScene! Duration:", data.duration);
        this.visionBoostStartTime = this.time.now;
        this.visionBoostDuration = data.duration;
        this.lastVisionSeconds = Math.ceil(data.duration / 1000);

        this.showVisionTimer();
        this.updateVisionCountdownDisplay();

        if (this.visionUpdateTimer) {
            this.visionUpdateTimer.destroy();
        }
        this.visionUpdateTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateVisionCountdownDisplay,
            callbackScope: this,
            loop: true
        });
    }

    private onVisionBoostExpired() {
        console.log("Vision boost expired in TimerScene!");
        this.hideVisionTimer();

        if (this.visionUpdateTimer) {
            this.visionUpdateTimer.destroy();
            this.visionUpdateTimer = null;
        }
    }

    private showSpeedTimer() {
        if (this.background) this.background.setVisible(true);
        if (this.title) this.title.setVisible(true);
        if (this.speedIcon) this.speedIcon.setVisible(true);
        if (this.countdownText) this.countdownText.setVisible(true);
        if (this.timerText) this.timerText.setVisible(true);
    }

    private hideSpeedTimer() {
        if (this.background) this.background.setVisible(false);
        if (this.title) this.title.setVisible(false);
        if (this.speedIcon) this.speedIcon.setVisible(false);
        if (this.countdownText) this.countdownText.setVisible(false);
        if (this.timerText) this.timerText.setVisible(false);
    }

    private showVisionTimer() {
        if (this.visionBackground) this.visionBackground.setVisible(true);
        if (this.visionTitle) this.visionTitle.setVisible(true);
        if (this.visionIcon) this.visionIcon.setVisible(true);
        if (this.visionCountdownText) this.visionCountdownText.setVisible(true);
        if (this.visionTimerText) this.visionTimerText.setVisible(true);
    }

    private hideVisionTimer() {
        if (this.visionBackground) this.visionBackground.setVisible(false);
        if (this.visionTitle) this.visionTitle.setVisible(false);
        if (this.visionIcon) this.visionIcon.setVisible(false);
        if (this.visionCountdownText) this.visionCountdownText.setVisible(false);
        if (this.visionTimerText) this.visionTimerText.setVisible(false);
    }

    private updateSpeedCountdownDisplay() {
        if (!this.countdownText) return;

        const currentTime = this.time.now;
        const elapsedTime = currentTime - this.speedBoostStartTime;
        const remainingTime = Math.max(0, this.speedBoostDuration - elapsedTime);
        const remainingSeconds = Math.ceil(remainingTime / 1000);

        if (remainingSeconds > 0) {
            if (remainingSeconds !== this.lastDisplayedSeconds) {
                console.log(`Speed countdown: ${this.lastDisplayedSeconds} -> ${remainingSeconds}`);
                this.lastDisplayedSeconds = remainingSeconds;
                this.countdownText.setText(remainingSeconds.toString());

                if (remainingSeconds <= 5) {
                    this.countdownText.setColor('#ff0000');
                    this.countdownText.setScale(1.2);
                } else {
                    this.countdownText.setColor('#00ff00');
                    this.countdownText.setScale(1.0);
                }
            }

            if (!this.background?.visible) {
                this.showSpeedTimer();
            }
        } else {
            this.hideSpeedTimer();

            if (this.updateTimer) {
                this.updateTimer.destroy();
                this.updateTimer = null;
            }
        }
    }

    private updateVisionCountdownDisplay() {
        if (!this.visionCountdownText) return;

        const currentTime = this.time.now;
        const elapsedTime = currentTime - this.visionBoostStartTime;
        const remainingTime = Math.max(0, this.visionBoostDuration - elapsedTime);
        const remainingSeconds = Math.ceil(remainingTime / 1000);

        if (remainingSeconds > 0) {
            if (remainingSeconds !== this.lastVisionSeconds) {
                console.log(`Vision countdown: ${this.lastVisionSeconds} -> ${remainingSeconds}`);
                this.lastVisionSeconds = remainingSeconds;
                this.visionCountdownText.setText(remainingSeconds.toString());

                if (remainingSeconds <= 5) {
                    this.visionCountdownText.setColor('#ff0000');
                    this.visionCountdownText.setScale(1.2);
                } else {
                    this.visionCountdownText.setColor('#0000ff');
                    this.visionCountdownText.setScale(1.0);
                }
            }

            if (!this.visionBackground?.visible) {
                this.showVisionTimer();
            }
        } else {
            this.hideVisionTimer();

            if (this.visionUpdateTimer) {
                this.visionUpdateTimer.destroy();
                this.visionUpdateTimer = null;
            }
        }
    }
}