import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Base Mainnet Addresses
const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC on Base
const ONEINCH_TOKEN_ADDRESS = "0xc5fecC3a29Fb57B5024eEc8a2239d4621e111CBE"; // 1INCH on Base
const ONEINCH_ROUTER = "0x111111125421cA6dc452d289314280a0f8842A65"; // 1inch Router v6 on Base

const buildGameStakingModule = buildModule("GameStaking", (m) => {
  // Configure contract parameters
  const requiredStake = "100000"; // 0.1 USDC (6 decimals)
  const winMultiplier = 120; // 20% bonus

  // Deploy GameStaking contract
  const gameStaking = m.contract("GameStaking", [
    USDC_ADDRESS,        // USDC token address on Base
    ONEINCH_TOKEN_ADDRESS, // 1INCH token address on Base
    ONEINCH_ROUTER,      // 1inch Router address on Base
    requiredStake,       // Required stake amount (in USDC)
    winMultiplier,       // Win multiplier (120 = 20% bonus)
  ]);

  return { gameStaking };
});

export default buildGameStakingModule;
