// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GameStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    uint256 public immutable requiredStake;
    uint256 public immutable winMultiplier; // e.g., 120 = 20% bonus
    
    mapping(bytes32 => bool) public activeGames;
    mapping(bytes32 => address) public gameToPlayer;
    
    event GameStarted(address indexed player, bytes32 gameId);
    event GameEnded(address indexed player, bytes32 gameId, bool won);

    constructor(
        address _stakingToken,
        uint256 _requiredStake,
        uint256 _winMultiplier
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        requiredStake = _requiredStake;
        winMultiplier = _winMultiplier;
    }

    function startGame() external nonReentrant returns (bytes32) {
        // Generate unique game ID
        bytes32 gameId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.number
        ));
        
        require(!activeGames[gameId], "Game ID already exists");
        
        // Take their stake
        stakingToken.safeTransferFrom(msg.sender, address(this), requiredStake);
        
        // Record the game
        activeGames[gameId] = true;
        gameToPlayer[gameId] = msg.sender;
        
        emit GameStarted(msg.sender, gameId);
        return gameId;
    }

    function endGame(bytes32 gameId, bool won) external nonReentrant {
        require(activeGames[gameId], "Game not active");
        require(gameToPlayer[gameId] == msg.sender, "Not your game");
        
        // Clean up game state
        activeGames[gameId] = false;
        
        if (won) {
            // Calculate and send winnings
            uint256 payout = (requiredStake * winMultiplier) / 100;
            // if payout is greater than the balance of the contract, set payout to the requiredStake
            if (payout > stakingToken.balanceOf(address(this))) {
                payout = requiredStake;
            }
            stakingToken.safeTransfer(msg.sender, payout);
        }
        emit GameEnded(msg.sender, gameId, won);
    }

    // Emergency withdrawal by owner (e.g., for upgrades or emergency situations)
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        stakingToken.safeTransfer(owner(), balance);
    }

    // Getter for contract's token balance
    function getContractBalance() external view returns (uint256) {
        return stakingToken.balanceOf(address(this));
    }

    // View function to check if a game is active
    function isGameActive(bytes32 gameId) external view returns (bool) {
        return activeGames[gameId];
    }
}
