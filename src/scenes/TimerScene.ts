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

    // Game timer properties
    private gameTimerBackground: Phaser.GameObjects.Rectangle;
    private gameTimerText: Phaser.GameObjects.Text;
    private gameTimerIcon: Phaser.GameObjects.Sprite;

    // Timer configuration
    private readonly timerWidth = 250;
    private readonly timerHeight = 60;
    private readonly padding = 15;
    private readonly backgroundColor = 0x000000;
    private readonly backgroundColorAlpha = 0.9;
    private readonly borderColor = 0x00ff00;
    private readonly visionBorderColor = 0x0000ff;
    private readonly gameTimerBorderColor = 0xff0000;
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

    // Game timer properties
    private gameStartTime: number = 0;
    private gameDuration: number = 5 * 60 * 1000; // 5 minutes in milliseconds
    private lastGameSeconds: number = 0;
    private gameUpdateTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super({ key: "TimerScene" });
    }

    create() {
        console.log("TimerScene created!");

        // Create game timer first (top left)
        this.createGameTimer();

        // Create speed boost timer (below game timer)
        this.createSpeedBoostTimer();

        // Create vision boost timer (below speed boost timer)
        this.createVisionBoostTimer();

        // Listen for player reference updates and boost events
        this.events.on('setPlayer', this.setPlayer, this);
        this.events.on('speedBoostActivated', this.onSpeedBoostActivated, this);
        this.events.on('speedBoostExpired', this.onSpeedBoostExpired, this);
        this.events.on('visionBoostActivated', this.onVisionBoostActivated, this);
        this.events.on('visionBoostExpired', this.onVisionBoostExpired, this);

        // Listen for global game over event
        this.game.events.on('gameOver', this.onGameOver, this);

        // Start game timer
        this.startGameTimer();

        console.log("TimerScene setup completed");
    }

    private createGameTimer() {
        const xPos = this.padding * 2;
        const yPos = this.padding * 2 + 20;

        this.gameTimerBackground = this.add.rectangle(
            xPos,
            yPos,
            this.timerWidth,
            this.timerHeight,
            this.backgroundColor,
            this.backgroundColorAlpha
        );
        this.gameTimerBackground.setDepth(1000);
        this.gameTimerBackground.setVisible(true);

        this.gameTimerIcon = this.add.sprite(
            xPos + 30,
            yPos + this.timerHeight / 2,
            'items',
            0
        );
        this.gameTimerIcon.setScale(1.2);
        this.gameTimerIcon.setDepth(1001);
        this.gameTimerIcon.setVisible(true);

        this.gameTimerText = this.add.text(
            xPos + 70,
            yPos + this.timerHeight / 2,
            'GAME TIME',
            {
                fontSize: '14px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
            }
        );
        this.gameTimerText.setOrigin(0, 0.5);
        this.gameTimerText.setDepth(1001);
        this.gameTimerText.setVisible(true);

        // Create countdown text for game timer
        const gameCountdownText = this.add.text(
            xPos + 180,
            yPos + this.timerHeight / 2,
            '5:00',
            {
                fontSize: '20px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 }
            }
        );
        gameCountdownText.setOrigin(0, 0.5);
        gameCountdownText.setDepth(1001);
        gameCountdownText.setVisible(true);
        this.gameTimerText = gameCountdownText; // Store reference
    }

    private createSpeedBoostTimer() {
        const xPos = this.padding * 2;
        const yPos = this.padding * 2 + 50 + this.timerHeight + 10; // Pushed down by 50 pixels

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
        const yPos = this.padding * 2 + 50 + (this.timerHeight + 10) * 2; // Pushed down by 50 pixels

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
            4
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

    private startGameTimer() {
        this.gameStartTime = this.time.now;
        this.lastGameSeconds = Math.ceil(this.gameDuration / 1000);

        this.gameUpdateTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTimer,
            callbackScope: this,
            loop: true
        });
    }

    private updateGameTimer() {
        const currentTime = this.time.now;
        const elapsedTime = currentTime - this.gameStartTime;
        const remainingTime = Math.max(0, this.gameDuration - elapsedTime);
        const remainingSeconds = Math.ceil(remainingTime / 1000);

        if (remainingSeconds > 0) {
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (this.gameTimerText) {
                this.gameTimerText.setText(timeString);

                // Add visual feedback for last 30 seconds
                if (remainingSeconds <= 30) {
                    this.gameTimerText.setColor('#ff0000');
                    this.gameTimerText.setScale(1.2);
                } else {
                    this.gameTimerText.setColor('#ff0000');
                    this.gameTimerText.setScale(1.0);
                }
            }
        } else {
            // Game over!
            this.endGame();
        }
    }

    private endGame() {
        console.log("Game Over! Time's up!");

        // Emit game over event instead of handling it directly
        this.events.emit('gameOver', { reason: 'time_up' });
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

    private onGameOver(data: { reason: string }) {
        console.log("=== GAME OVER EVENT RECEIVED IN TIMERSCENE ===");
        console.log("Game Over in TimerScene! Reason:", data.reason);

        // Stop all timers
        if (this.gameUpdateTimer) {
            this.gameUpdateTimer.destroy();
        }
        if (this.updateTimer) {
            this.updateTimer.destroy();
        }
        if (this.visionUpdateTimer) {
            this.visionUpdateTimer.destroy();
        }

        // Show game over message
        const gameWidth = this.game.scale.width;
        const gameHeight = this.game.scale.height;

        console.log("Game dimensions:", gameWidth, "x", gameHeight);

        let gameOverMessage = 'GAME OVER';
        if (data.reason === 'player_died') {
            gameOverMessage = 'GAME OVER\nYou Died!';
        } else if (data.reason === 'time_up') {
            gameOverMessage = 'GAME OVER\nTime\'s Up!';
        }

        console.log("Creating game over text with message:", gameOverMessage);

        const gameOverText = this.add.text(
            gameWidth / 2,
            gameHeight / 2,
            gameOverMessage,
            {
                fontSize: '32px',
                color: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setDepth(3000);

        console.log("Game over text created at position:", gameOverText.x, gameOverText.y);
        console.log("Game over text depth:", gameOverText.depth);

        // Stop the game after 3 seconds
        this.time.delayedCall(3000, () => {
            console.log("Game ended due to player death");
            // You can add restart logic here or return to main menu
        });
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