// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAggregationRouterV5 {
    struct SwapDescription {
        IERC20 srcToken;
        IERC20 dstToken;
        address payable srcReceiver;
        address payable dstReceiver;
        uint256 amount;
        uint256 minReturnAmount;
        uint256 flags;
    }

    function swap(
        address executor,
        SwapDescription calldata desc,
        bytes calldata permit,
        bytes calldata data
    ) external payable returns (uint256 returnAmount, uint256 spentAmount);
}

contract GameStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;  // USDC
    IERC20 public immutable rewardToken;   // 1INCH token
    IAggregationRouterV5 public immutable oneInchRouter;
    
    uint256 public immutable requiredStake;
    uint256 public immutable winMultiplier; // e.g., 120 = 20% bonus
    
    mapping(bytes32 => bool) public activeGames;
    mapping(bytes32 => address) public gameToPlayer;
    
    event GameStarted(address indexed player, bytes32 gameId);
    event GameEnded(address indexed player, bytes32 gameId, bool won, uint256 rewardAmount);

    constructor(
        address _stakingToken,      // USDC address
        address _rewardToken,       // 1INCH address
        address _oneInchRouter,
        uint256 _requiredStake,     // Amount in USDC (6 decimals)
        uint256 _winMultiplier
    ) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        oneInchRouter = IAggregationRouterV5(_oneInchRouter);
        requiredStake = _requiredStake;
        winMultiplier = _winMultiplier;
    }

    function startGame() external nonReentrant returns (bytes32) {
        // Take their USDC stake
        stakingToken.safeTransferFrom(msg.sender, address(this), requiredStake);

        bytes32 gameId = keccak256(abi.encodePacked(
            msg.sender,
            block.timestamp,
            block.number
        ));
        
        require(!activeGames[gameId], "Game ID already exists");
        
        // Record the game
        activeGames[gameId] = true;
        gameToPlayer[gameId] = msg.sender;
        
        emit GameStarted(msg.sender, gameId);
        return gameId;
    }

    function endGame(
        bytes32 gameId,
        bool won,
        bytes calldata swapData
    ) external nonReentrant {
        require(activeGames[gameId], "Game not active");
        require(gameToPlayer[gameId] == msg.sender, "Not your game");
        
        // Clean up game state
        activeGames[gameId] = false;
        
        if (won) {
            // Calculate reward amount including bonus
            uint256 payout = (requiredStake * winMultiplier) / 100;
            
            // Safety check for available balance
            if (payout > stakingToken.balanceOf(address(this))) {
                payout = requiredStake;
            }

            // Approve 1inch router to spend our USDC
            stakingToken.safeApprove(address(oneInchRouter), payout);
            
            // Perform the swap through 1inch
            (uint256 returnAmount,) = oneInchRouter.swap(
                address(0), // executor
                IAggregationRouterV5.SwapDescription({
                    srcToken: stakingToken,
                    dstToken: rewardToken,
                    srcReceiver: payable(address(this)),
                    dstReceiver: payable(msg.sender),
                    amount: payout,
                    minReturnAmount: 1, // You should calculate this from the 1inch API
                    flags: 0
                }),
                "", // permit
                swapData // Get this from 1inch API
            );
            
            emit GameEnded(msg.sender, gameId, true, returnAmount);
        } else {
            emit GameEnded(msg.sender, gameId, false, 0);
        }
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

    // Emergency function to revoke approvals if needed
    function revokeApproval() external {
        stakingToken.safeApprove(address(oneInchRouter), 0);
    }
}
