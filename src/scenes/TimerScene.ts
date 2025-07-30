import Phaser from "phaser";
import Player from "../entities/Player";

export default class TimerScene extends Phaser.Scene {
    private player: Player | null = null;
    private background: Phaser.GameObjects.Rectangle;
    private timerText: Phaser.GameObjects.Text;
    private title: Phaser.GameObjects.Text;
    private speedIcon: Phaser.GameObjects.Sprite;
    private countdownText: Phaser.GameObjects.Text;

    // Timer configuration
    private readonly timerWidth = 250; // Increased width for side-by-side layout
    private readonly timerHeight = 60; // Reduced height since we're using one row
    private readonly padding = 15;
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.9;
    private readonly borderColor = 0x00ff00;
    private readonly borderWidth = 2;

    // Countdown properties
    private speedBoostStartTime: number = 0;
    private speedBoostDuration: number = 0;
    private lastDisplayedSeconds: number = 0;
    private updateTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super({ key: "TimerScene" });
    }

    create() {
        console.log("TimerScene created!");

        // Create background
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

        // Create speed icon (larger size)
        this.speedIcon = this.add.sprite(
            xPos + 30,
            yPos + this.timerHeight / 2,
            'items',
            3
        );
        this.speedIcon.setScale(1.2); // Increased from 0.8 to 1.2
        this.speedIcon.setDepth(1001);
        this.speedIcon.setVisible(false);

        // Create title (SPEED BOOST) - positioned to the right of the icon
        this.title = this.add.text(
            xPos + 50, // Positioned after the icon
            yPos + this.timerHeight / 2,
            'SPEED BOOST',
            {
                fontSize: '14px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.title.setOrigin(0, 0.5); // Left-aligned
        this.title.setDepth(1001);
        this.title.setVisible(false);

        // Create countdown text (number) - positioned to the right of "SPEED BOOST"
        this.countdownText = this.add.text(
            xPos + 160, // Positioned after "SPEED BOOST"
            yPos + this.timerHeight / 2,
            '30',
            {
                fontSize: '20px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        this.countdownText.setOrigin(0, 0.5); // Left-aligned
        this.countdownText.setDepth(1001);
        this.countdownText.setVisible(false);

        // Create timer text (smaller, for seconds label) - positioned below the countdown
        this.timerText = this.add.text(
            xPos + 160, // Same x position as countdown
            yPos + this.timerHeight - 8,
            's',
            {
                fontSize: '10px',
                color: '#00ff00',
                backgroundColor: '#000000',
                padding: { x: 2, y: 1 }
            }
        );
        this.timerText.setOrigin(0, 0.5); // Left-aligned
        this.timerText.setDepth(1001);
        this.timerText.setVisible(false);

        // Listen for player reference updates and speed boost events
        this.events.on('setPlayer', this.setPlayer, this);
        this.events.on('speedBoostActivated', this.onSpeedBoostActivated, this);
        this.events.on('speedBoostExpired', this.onSpeedBoostExpired, this);

        console.log("TimerScene setup completed");
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

        this.showTimer();
        this.updateCountdownDisplay();

        // Start a timer that updates every second
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        this.updateTimer = this.time.addEvent({
            delay: 1000, // Update every 1000ms (1 second)
            callback: this.updateCountdownDisplay,
            callbackScope: this,
            loop: true
        });
    }

    private onSpeedBoostExpired() {
        console.log("Speed boost expired in TimerScene!");
        this.hideTimer();

        // Stop the update timer
        if (this.updateTimer) {
            this.updateTimer.destroy();
            this.updateTimer = null;
        }
    }

    private showTimer() {
        if (this.background) this.background.setVisible(true);
        if (this.title) this.title.setVisible(true);
        if (this.speedIcon) this.speedIcon.setVisible(true);
        if (this.countdownText) this.countdownText.setVisible(true);
        if (this.timerText) this.timerText.setVisible(true);
    }

    private hideTimer() {
        if (this.background) this.background.setVisible(false);
        if (this.title) this.title.setVisible(false);
        if (this.speedIcon) this.speedIcon.setVisible(false);
        if (this.countdownText) this.countdownText.setVisible(false);
        if (this.timerText) this.timerText.setVisible(false);
    }

    private updateCountdownDisplay() {
        if (!this.countdownText) return;

        // Calculate remaining time using real clock
        const currentTime = this.time.now;
        const elapsedTime = currentTime - this.speedBoostStartTime;
        const remainingTime = Math.max(0, this.speedBoostDuration - elapsedTime);
        const remainingSeconds = Math.ceil(remainingTime / 1000);

        console.log(`Current time: ${currentTime}, Start time: ${this.speedBoostStartTime}, Elapsed: ${elapsedTime}, Remaining: ${remainingTime}, Seconds: ${remainingSeconds}`);

        if (remainingSeconds > 0) {
            // Update display if the seconds have changed
            if (remainingSeconds !== this.lastDisplayedSeconds) {
                console.log(`Countdown: ${this.lastDisplayedSeconds} -> ${remainingSeconds}`);
                this.lastDisplayedSeconds = remainingSeconds;
                this.countdownText.setText(remainingSeconds.toString());

                // Add visual feedback for last 5 seconds
                if (remainingSeconds <= 5) {
                    this.countdownText.setColor('#ff0000'); // Red for last 5 seconds
                    this.countdownText.setScale(1.2); // Slightly larger
                } else {
                    this.countdownText.setColor('#00ff00'); // Green for normal time
                    this.countdownText.setScale(1.0); // Normal size
                }
            }

            // Show timer if not already visible
            if (!this.background?.visible) {
                this.showTimer();
            }
        } else {
            // Hide timer when countdown reaches 0
            this.hideTimer();

            // Stop the update timer
            if (this.updateTimer) {
                this.updateTimer.destroy();
                this.updateTimer = null;
            }
        }
    }
}