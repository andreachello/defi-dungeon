import axios from 'axios';
import { ethers } from 'ethers';

// ABI for the staking contract
const STAKING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_stakingToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_rewardToken",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_oneInchRouter",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_requiredStake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_winMultiplier",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "won",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      }
    ],
    "name": "GameEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      }
    ],
    "name": "GameStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "activeGames",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      },
      {
        "internalType": "bool",
        "name": "won",
        "type": "bool"
      },
      {
        "internalType": "bytes",
        "name": "swapData",
        "type": "bytes"
      }
    ],
    "name": "endGame",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "gameToPlayer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "gameId",
        "type": "bytes32"
      }
    ],
    "name": "isGameActive",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "oneInchRouter",
    "outputs": [
      {
        "internalType": "contract IAggregationRouterV5",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "requiredStake",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "revokeApproval",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakingToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startGame",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "winMultiplier",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const STAKING_CONTRACT_ADDRESS = "0x36F371216FA08C324d5DABe1C32542396C0d5200";

// Base Mainnet Addresses
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC on Base
const ONEINCH_TOKEN_ADDRESS = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE"; // 1INCH on Base

async function get1InchSwapData(amount: string) {
    try {
        const response = await fetch(`/api/1inch/swap-data?amount=${amount}`);
        if (!response.ok) {
            throw new Error('Failed to fetch swap data');
        }
        const data = await response.json();
        return data.tx.data;
    } catch (error) {
        console.error('Error fetching swap data:', error);
        throw error;
    }
}

// Interface for game session
export interface GameSession {
  gameId: string;
  playerAddress: string;
  isActive: boolean;
  startTime: number;
}

// Create contract instance
function createContract(
  provider: ethers.Provider | ethers.Signer,
  address: string = STAKING_CONTRACT_ADDRESS
): ethers.Contract {
  return new ethers.Contract(address, STAKING_ABI, provider);
}

// Read functions
export async function getContractBalance(contract: ethers.Contract): Promise<bigint> {
  return await contract.getContractBalance();
}

export async function isGameActive(contract: ethers.Contract, gameId: string): Promise<boolean> {
  return await contract.isGameActive(gameId);
}

export async function getRequiredStake(contract: ethers.Contract): Promise<bigint> {
  return await contract.requiredStake();
}

export async function getWinMultiplier(contract: ethers.Contract): Promise<bigint> {
  return await contract.winMultiplier();
}

export async function getStakingToken(contract: ethers.Contract): Promise<string> {
  return await contract.stakingToken();
}

export async function getGamePlayer(contract: ethers.Contract, gameId: string): Promise<string> {
  return await contract.gameToPlayer(gameId);
}

// Write functions
export async function startGame(contract: ethers.Contract): Promise<{ gameId: string; wait: () => Promise<any> }> {
  const tx = await contract.startGame();
  const receipt = await tx.wait();

  // Get gameId from event logs
  const gameStartedEvent = receipt.logs.find(
    (log: any) => log.eventName === 'GameStarted'
  );

  return {
    gameId: gameStartedEvent?.args?.gameId || '',
    wait: () => tx.wait()
  };
}

// Update the endGame function to handle the swapData parameter
export async function endGame(
    contract: ethers.Contract,
    gameId: string,
    won: boolean,
    swapData: string = '0x' // Add default empty bytes for losses
): Promise<{ wait: () => Promise<any> }> {
    const tx = await contract.endGame(gameId, won, swapData);
    return {
        wait: () => tx.wait()
    };
}

// Add a helper function to handle the complete end game flow
export async function handleGameEnd(
    contract: ethers.Contract,
    gameId: string,
    won: boolean
): Promise<{ wait: () => Promise<any> }> {
    if (won) {
        try {
            // Get required stake and multiplier
            const requiredStake = await contract.requiredStake();
            const winMultiplier = await contract.winMultiplier();
            
            // Calculate payout
            const payout = BigInt(requiredStake * winMultiplier) / BigInt(100);
            
            // Get swap data from 1inch
            const response = await fetch(
                `/api/1inch/swap-data?amount=${payout.toString()}&receiver=${await contract.gameToPlayer(gameId)}`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch swap data');
            }
            const data = await response.json();
            
            // End game with the swap data
            return await endGame(contract, gameId, true, data.tx.data);
        } catch (error) {
            console.error('Error handling game end with swap:', error);
            throw error;
        }
    } else {
        // For losses, just end the game without swap data
        return await endGame(contract, gameId, false);
    }
}

// Admin functions
export async function emergencyWithdraw(
  contract: ethers.Contract
): Promise<{ wait: () => Promise<any> }> {
  const tx = await contract.emergencyWithdraw();
  return {
    wait: () => tx.wait()
  };
}

export async function transferOwnership(
  contract: ethers.Contract,
  newOwner: string
): Promise<{ wait: () => Promise<any> }> {
  const tx = await contract.transferOwnership(newOwner);
  return {
    wait: () => tx.wait()
  };
}

// Event listeners
export function subscribeToGameStarted(
  contract: ethers.Contract,
  callback: (player: string, gameId: string) => void
): Promise<ethers.Contract> {
  return contract.on('GameStarted', (player, gameId) => {
    callback(player, gameId);
  });
}

// Update the event listener to include reward amount
export function subscribeToGameEnded(
    contract: ethers.Contract,
    callback: (player: string, gameId: string, won: boolean, rewardAmount: bigint) => void
): Promise<ethers.Contract> {
    return contract.on('GameEnded', (player, gameId, won, rewardAmount) => {
        callback(player, gameId, won, rewardAmount);
    });
}

export function removeAllListeners(contract: ethers.Contract): void {
  contract.removeAllListeners();
}

// Helper function to get a configured contract instance
export function getStakingContract(provider: ethers.Provider | ethers.Signer): ethers.Contract {
  return createContract(provider);
}

// Add a function to check USDC allowance
export async function checkUSDCAllowance(
    usdcContract: ethers.Contract,
    owner: string,
    spender: string
): Promise<bigint> {
    return await usdcContract.allowance(owner, spender);
}

// Add a function to approve USDC spending
export async function approveUSDC(
    usdcContract: ethers.Contract,
    spender: string,
    amount: bigint
): Promise<{ wait: () => Promise<any> }> {
    const tx = await usdcContract.approve(spender, amount);
    return {
        wait: () => tx.wait()
    };
}

// Helper function to create USDC contract instance
export function getUSDCContract(provider: ethers.Provider | ethers.Signer): ethers.Contract {
    const abi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)"
    ];
    return new ethers.Contract(USDC_ADDRESS, abi, provider);
}

// Example usage in your game component:
/*
async function onGameEnd(won: boolean) {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = getStakingContract(signer);
        
        // Handle game end with swap if won
        const tx = await handleGameEnd(contract, currentGameId, won);
        await tx.wait();
        
        // Handle success
    } catch (error) {
        console.error('Error ending game:', error);
        // Handle error
    }
}
*/
