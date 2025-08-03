import { ethers } from 'ethers';
import { config } from '../config';
import { getAccount, readContract, writeContract, getContract } from '@wagmi/core';

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

// You'll need to set these values based on your deployment
export const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS as `0x${string}`;
export const STAKING_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKING_TOKEN_ADDRESS as `0x${string}`;

// Interface for game session
export interface GameSession {
  gameId: string;
  playerAddress: string;
  isActive: boolean;
  startTime: number;
}

/**
 * Get the required stake amount
 */
export async function getRequiredStake(): Promise<bigint> {
  const data = await readContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'requiredStake',
  });
  return data;
}

/**
 * Check if the user has approved enough tokens for staking
 */
export async function checkTokenAllowance(userAddress: string): Promise<boolean> {
  const erc20Abi = ['function allowance(address owner, address spender) view returns (uint256)'];
  
  const allowance = await readContract({
    address: STAKING_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [userAddress, STAKING_CONTRACT_ADDRESS],
  });

  const requiredStake = await getRequiredStake();
  return allowance >= requiredStake;
}

/**
 * Approve tokens for staking
 */
export async function approveTokens() {
  const erc20Abi = ['function approve(address spender, uint256 amount)'];
  const requiredStake = await getRequiredStake();

  const { hash } = await writeContract({
    address: STAKING_TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: 'approve',
    args: [STAKING_CONTRACT_ADDRESS, requiredStake],
  });

  return hash;
}

/**
 * Start a new game session
 */
export async function startGame(): Promise<GameSession> {
  const account = getAccount();
  if (!account.address) throw new Error('No wallet connected');

  // Check allowance first
  const hasAllowance = await checkTokenAllowance(account.address);
  if (!hasAllowance) {
    throw new Error('Please approve tokens first');
  }

  const { hash } = await writeContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'startGame',
  });

  // Wait for transaction to be mined to get the game ID from events
  const provider = new ethers.JsonRpcProvider(config.transport.url);
  const receipt = await provider.getTransactionReceipt(hash);
  
  if (!receipt) throw new Error('Transaction failed');

  // Parse the GameStarted event to get the game ID
  const contract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, STAKING_ABI, provider);
  const events = receipt.logs
    .map(log => {
      try {
        return contract.interface.parseLog(log as any);
      } catch {
        return null;
      }
    })
    .filter(event => event?.name === 'GameStarted');

  if (!events.length) throw new Error('Could not find GameStarted event');

  const gameId = events[0]?.args?.gameId;

  return {
    gameId,
    playerAddress: account.address,
    isActive: true,
    startTime: Date.now(),
  };
}

/**
 * End a game session
 */
export async function endGame(gameId: string, won: boolean): Promise<string> {
  const { hash } = await writeContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'endGame',
    args: [gameId, won],
  });

  return hash;
}

/**
 * Check if a game is active
 */
export async function isGameActive(gameId: string): Promise<boolean> {
  const isActive = await readContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'isGameActive',
    args: [gameId],
  });

  return isActive;
}

/**
 * Get contract token balance
 */
export async function getContractBalance(): Promise<bigint> {
  const balance = await readContract({
    address: STAKING_CONTRACT_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getContractBalance',
  });

  return balance;
}