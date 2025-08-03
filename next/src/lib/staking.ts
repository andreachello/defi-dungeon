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

export async function endGame(
  contract: ethers.Contract,
  gameId: string,
  won: boolean
): Promise<{ wait: () => Promise<any> }> {
  const tx = await contract.endGame(gameId, won);
  return {
    wait: () => tx.wait()
  };
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

export function subscribeToGameEnded(
  contract: ethers.Contract,
  callback: (player: string, gameId: string, won: boolean) => void
): Promise<ethers.Contract> {
  return contract.on('GameEnded', (player, gameId, won) => {
    callback(player, gameId, won);
  });
}

export function removeAllListeners(contract: ethers.Contract): void {
  contract.removeAllListeners();
}

// Helper function to get a configured contract instance
export function getStakingContract(provider: ethers.Provider | ethers.Signer): ethers.Contract {
  return createContract(provider);
}
