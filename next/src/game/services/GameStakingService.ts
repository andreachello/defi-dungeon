import { ethers } from 'ethers';
import {
    getStakingContract,
    startGame,
    endGame,
    handleGameEnd,
    getRequiredStake,
    getWinMultiplier,
    getUSDCContract,
    checkUSDCAllowance,
    approveUSDC
} from '../../lib/staking';

export interface GameSession {
    gameId: string;
    playerAddress: string;
    isActive: boolean;
    startTime: number;
    stakeAmount?: bigint;
}

// Add these helper functions for BigInt serialization
function serializeGameSession(session: GameSession): string {
    const serializableSession = {
        ...session,
        stakeAmount: session.stakeAmount ? session.stakeAmount.toString() : undefined
    };
    return JSON.stringify(serializableSession);
}

function deserializeGameSession(jsonString: string): GameSession {
    const parsed = JSON.parse(jsonString);
    return {
        ...parsed,
        stakeAmount: parsed.stakeAmount ? BigInt(parsed.stakeAmount) : undefined
    };
}

export default class GameStakingService {
    private static instance: GameStakingService;
    private currentSession: GameSession | null = null;
    private contract: ethers.Contract | null = null;
    private usdcContract: ethers.Contract | null = null;
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.Signer | null = null;

    private constructor() { }

    static getInstance(): GameStakingService {
        if (!GameStakingService.instance) {
            GameStakingService.instance = new GameStakingService();
        }
        return GameStakingService.instance;
    }

    async initialize(): Promise<boolean> {
        try {
            if (typeof window === 'undefined' || !window.ethereum) {
                console.error('No Ethereum provider found');
                return false;
            }

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.contract = getStakingContract(this.signer);
            this.usdcContract = getUSDCContract(this.signer);

            console.log('GameStakingService initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize GameStakingService:', error);
            return false;
        }
    }

    async checkAndApproveUSDC(): Promise<boolean> {
        try {
            if (!this.contract || !this.usdcContract || !this.signer) {
                console.error('Contracts not initialized');
                return false;
            }

            // Get required stake amount
            const requiredStake = await getRequiredStake(this.contract);
            console.log('Required stake:', requiredStake.toString());

            // Get player address
            const playerAddress = await this.signer.getAddress();
            console.log('Player address:', playerAddress);

            // Get contract address
            const contractAddress = this.contract.target;
            console.log('Contract address:', contractAddress);

            // Check current allowance
            const allowance = await checkUSDCAllowance(this.usdcContract, playerAddress, contractAddress);
            console.log('Current allowance:', allowance.toString());

            if (allowance < requiredStake) {
                console.log('Insufficient allowance, requesting approval...');
                console.log('Approving amount:', requiredStake.toString());

                const approveTx = await approveUSDC(this.usdcContract, contractAddress, requiredStake);
                console.log('Approval transaction sent, waiting for confirmation...');

                const receipt = await approveTx.wait();
                console.log('USDC approval successful, receipt:', receipt);

                // Verify the approval
                const newAllowance = await checkUSDCAllowance(this.usdcContract, playerAddress, contractAddress);
                console.log('New allowance:', newAllowance.toString());

                return true;
            } else {
                console.log('Sufficient allowance already exists');
                return true;
            }
        } catch (error) {
            console.error('Failed to check and approve USDC:', error);
            return false;
        }
    }

    async startGameSession(): Promise<GameSession | null> {
        try {
            if (!this.contract || !this.signer) {
                console.error('Contract or signer not initialized');
                return null;
            }

            // Check and approve USDC if needed
            const approved = await this.checkAndApproveUSDC();
            if (!approved) {
                console.error('USDC approval failed');
                return null;
            }

            // Start the game on the contract
            const result = await startGame(this.contract);
            const gameId = result.gameId;

            console.log('Game started with ID:', gameId);

            // Get player address and stake amount
            const playerAddress = await this.signer.getAddress();
            const requiredStake = await getRequiredStake(this.contract);

            // Create session object
            this.currentSession = {
                gameId,
                playerAddress,
                isActive: true,
                startTime: Date.now(),
                stakeAmount: requiredStake
            };

            // Store session in localStorage for persistence
            localStorage.setItem('current_game_session', serializeGameSession(this.currentSession));

            return this.currentSession;
        } catch (error) {
            console.error('Failed to start game session:', error);
            return null;
        }
    }

    async endGameSession(won: boolean): Promise<boolean> {
        try {
            if (!this.contract || !this.currentSession) {
                console.error('No active game session or contract not initialized');
                return false;
            }

            console.log(`Ending game session. Won: ${won}, Game ID: ${this.currentSession.gameId}`);

            // End the game on the contract
            const result = await handleGameEnd(this.contract, this.currentSession.gameId, won);
            await result.wait();

            console.log('Game ended successfully on contract');

            // Update session
            this.currentSession.isActive = false;
            localStorage.setItem('current_game_session', serializeGameSession(this.currentSession));

            // Clear current session
            this.currentSession = null;
            localStorage.removeItem('current_game_session');

            return true;
        } catch (error) {
            console.error('Failed to end game session:', error);
            return false;
        }
    }

    getCurrentSession(): GameSession | null {
        if (!this.currentSession) {
            // Try to load from localStorage
            const savedSession = localStorage.getItem('current_game_session');
            if (savedSession) {
                try {
                    this.currentSession = deserializeGameSession(savedSession);
                } catch (error) {
                    console.error('Failed to parse saved session:', error);
                    localStorage.removeItem('current_game_session');
                }
            }
        }
        return this.currentSession;
    }

    clearCurrentSession(): void {
        this.currentSession = null;
        localStorage.removeItem('current_game_session');
    }

    async getStakeInfo(): Promise<{ requiredStake: bigint; winMultiplier: bigint } | null> {
        try {
            if (!this.contract) {
                console.error('Contract not initialized');
                return null;
            }

            const requiredStake = await getRequiredStake(this.contract);
            const winMultiplier = await getWinMultiplier(this.contract);

            return { requiredStake, winMultiplier };
        } catch (error) {
            console.error('Failed to get stake info:', error);
            return null;
        }
    }

    isInitialized(): boolean {
        return this.contract !== null && this.signer !== null;
    }
} 