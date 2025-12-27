// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreditManager
 * @author TrustPulse
 * @notice Production credit scoring system using 0-1000 scale (Fintech Standard)
 * @dev Implements Genesis Scoring, Liquidity Boost, and Repayment History
 */
contract CreditManager is ReentrancyGuard, Ownable {
    // ============ Structs ============
    
    struct CreditProfile {
        uint256 score;            // 0-1000 scale
        uint256 totalBorrowed;    // Lifetime borrowed amount
        uint256 totalRepaid;      // Lifetime repaid amount
        uint256 totalDeposited;   // Lifetime LP deposits (for score boost)
        bool isInitialized;       // Profile initialization flag
    }
    
    // ============ Constants ============
    
    // Score limits
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant MAX_GENESIS_SCORE = 500;
    uint256 public constant MAX_DEPOSIT_BOOST = 400;
    uint256 public constant MAX_REPAYMENT_BOOST = 100;
    
    // Genesis score thresholds (based on wallet balance)
    uint256 public constant TIER_1_BALANCE = 1 ether;      // >= 1 ETH = 500 points
    uint256 public constant TIER_2_BALANCE = 0.1 ether;    // >= 0.1 ETH = 250 points
    uint256 public constant TIER_3_BALANCE = 0.01 ether;   // >= 0.01 ETH = 100 points
    
    // Deposit scoring: +50 points per 0.1 ETH deposited
    uint256 public constant DEPOSIT_SCORE_UNIT = 0.1 ether;
    uint256 public constant DEPOSIT_SCORE_POINTS = 50;
    
    // Repayment scoring: +10 points per successful repayment
    uint256 public constant REPAYMENT_SCORE_POINTS = 10;
    
    // Borrow limit tiers
    uint256 public constant LIMIT_TIER_0 = 0;              // Score < 200: No borrowing
    uint256 public constant LIMIT_TIER_1 = 0.05 ether;     // Score 200-500
    uint256 public constant LIMIT_TIER_2 = 0.5 ether;      // Score 501-800
    uint256 public constant LIMIT_TIER_3 = 5 ether;        // Score > 800
    
    // ============ State Variables ============
    
    /// @notice Mapping from user address to their credit profile
    mapping(address => CreditProfile) public creditProfiles;
    
    /// @notice Address of the LendingPool contract (authorized caller)
    address public lendingPool;
    
    // ============ Events ============
    
    event ProfileInitialized(address indexed user, uint256 genesisScore);
    event GenesisScoreUpdated(address indexed user, uint256 newGenesisScore);
    event DepositScoreUpdated(address indexed user, uint256 depositAmount, uint256 newScore);
    event RepaymentScoreUpdated(address indexed user, uint256 repaymentAmount, uint256 newScore);
    event BorrowRecorded(address indexed user, uint256 amount, uint256 totalBorrowed);
    event LendingPoolSet(address indexed lendingPool);
    
    // ============ Modifiers ============
    
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "CreditManager: Only LendingPool");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the LendingPool address
     * @param _lendingPool The address of the LendingPool contract
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "CreditManager: Invalid address");
        lendingPool = _lendingPool;
        emit LendingPoolSet(_lendingPool);
    }
    
    // ============ Score Calculation Functions ============
    
    /**
     * @notice Calculate and initialize the Genesis Score based on wallet balance
     * @param user The address of the user
     * @return score The calculated genesis score (0-500)
     */
    function calculateGenesisScore(address user) external nonReentrant returns (uint256 score) {
        CreditProfile storage profile = creditProfiles[user];
        
        // Calculate genesis score based on current wallet balance
        uint256 balance = user.balance;
        
        if (balance >= TIER_1_BALANCE) {
            score = 500;
        } else if (balance >= TIER_2_BALANCE) {
            score = 250;
        } else if (balance >= TIER_3_BALANCE) {
            score = 100;
        } else {
            score = 0;
        }
        
        if (!profile.isInitialized) {
            // First time: initialize profile with genesis score
            profile.score = score;
            profile.isInitialized = true;
            emit ProfileInitialized(user, score);
        } else {
            // Already initialized: recalculate total score preserving deposit/repayment boosts
            uint256 depositBoost = _calculateDepositBoost(profile.totalDeposited);
            uint256 repaymentBoost = _calculateRepaymentBoost(profile.totalRepaid);
            
            uint256 newTotalScore = score + depositBoost + repaymentBoost;
            if (newTotalScore > MAX_SCORE) {
                newTotalScore = MAX_SCORE;
            }
            
            profile.score = newTotalScore;
            emit GenesisScoreUpdated(user, newTotalScore);
        }
        
        return profile.score;
    }
    
    /**
     * @notice Update score after LP deposit (+50 points per 0.1 ETH, max +400)
     * @param user The address of the depositor
     * @param amount The deposit amount in wei
     * @dev Can only be called by LendingPool
     */
    function updateScoreAfterDeposit(address user, uint256 amount) external onlyLendingPool {
        CreditProfile storage profile = creditProfiles[user];
        
        // Initialize if not already
        if (!profile.isInitialized) {
            profile.isInitialized = true;
            profile.score = _calculateGenesisScoreInternal(user);
            emit ProfileInitialized(user, profile.score);
        }
        
        // Track total deposited
        profile.totalDeposited += amount;
        
        // Calculate new deposit boost (capped at MAX_DEPOSIT_BOOST)
        uint256 depositBoost = _calculateDepositBoost(profile.totalDeposited);
        
        // Recalculate total score
        uint256 genesisScore = _calculateGenesisScoreInternal(user);
        uint256 repaymentBoost = _calculateRepaymentBoost(profile.totalRepaid);
        
        uint256 newScore = genesisScore + depositBoost + repaymentBoost;
        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }
        
        profile.score = newScore;
        
        emit DepositScoreUpdated(user, amount, newScore);
    }
    
    /**
     * @notice Update score after successful loan repayment (+10 points per repayment)
     * @param user The address of the borrower
     * @param amount The repayment amount in wei
     * @dev Can only be called by LendingPool
     */
    function updateScoreAfterRepayment(address user, uint256 amount) external onlyLendingPool {
        CreditProfile storage profile = creditProfiles[user];
        require(profile.isInitialized, "CreditManager: Profile not initialized");
        
        // Track total repaid
        profile.totalRepaid += amount;
        
        // Calculate new repayment boost
        uint256 repaymentBoost = _calculateRepaymentBoost(profile.totalRepaid);
        
        // Recalculate total score
        uint256 genesisScore = _calculateGenesisScoreInternal(user);
        uint256 depositBoost = _calculateDepositBoost(profile.totalDeposited);
        
        uint256 newScore = genesisScore + depositBoost + repaymentBoost;
        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }
        
        profile.score = newScore;
        
        emit RepaymentScoreUpdated(user, amount, newScore);
    }
    
    /**
     * @notice Record a borrow for tracking purposes
     * @param user The address of the borrower
     * @param amount The borrowed amount in wei
     * @dev Can only be called by LendingPool
     */
    function recordBorrow(address user, uint256 amount) external onlyLendingPool {
        CreditProfile storage profile = creditProfiles[user];
        require(profile.isInitialized, "CreditManager: Profile not initialized");
        
        profile.totalBorrowed += amount;
        
        emit BorrowRecorded(user, amount, profile.totalBorrowed);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the borrow limit for a user based on their credit score
     * @param user The address of the user
     * @return limit The maximum borrowable amount in wei
     */
    function getBorrowLimit(address user) external view returns (uint256 limit) {
        uint256 score = creditProfiles[user].score;
        
        if (score > 800) {
            return LIMIT_TIER_3; // 5 ETH
        } else if (score >= 501) {
            return LIMIT_TIER_2; // 0.5 ETH
        } else if (score >= 200) {
            return LIMIT_TIER_1; // 0.05 ETH
        } else {
            return LIMIT_TIER_0; // 0 ETH - No borrowing allowed
        }
    }
    
    /**
     * @notice Get the full credit profile for a user
     * @param user The address of the user
     * @return The user's CreditProfile struct
     */
    function getCreditProfile(address user) external view returns (CreditProfile memory) {
        return creditProfiles[user];
    }
    
    /**
     * @notice Get the credit score for a user
     * @param user The address of the user
     * @return The user's credit score (0-1000)
     */
    function getCreditScore(address user) external view returns (uint256) {
        return creditProfiles[user].score;
    }
    
    /**
     * @notice Check if a user's profile is initialized
     * @param user The address of the user
     * @return Whether the profile is initialized
     */
    function isProfileInitialized(address user) external view returns (bool) {
        return creditProfiles[user].isInitialized;
    }
    
    /**
     * @notice Get the score breakdown for a user
     * @param user The address of the user
     * @return genesisScore The genesis score component
     * @return depositBoost The deposit boost component
     * @return repaymentBoost The repayment boost component
     * @return totalScore The total credit score
     */
    function getScoreBreakdown(address user) external view returns (
        uint256 genesisScore,
        uint256 depositBoost,
        uint256 repaymentBoost,
        uint256 totalScore
    ) {
        CreditProfile storage profile = creditProfiles[user];
        
        genesisScore = _calculateGenesisScoreInternal(user);
        depositBoost = _calculateDepositBoost(profile.totalDeposited);
        repaymentBoost = _calculateRepaymentBoost(profile.totalRepaid);
        totalScore = profile.score;
        
        return (genesisScore, depositBoost, repaymentBoost, totalScore);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Calculate genesis score based on wallet balance (internal view)
     */
    function _calculateGenesisScoreInternal(address user) internal view returns (uint256) {
        uint256 balance = user.balance;
        
        if (balance >= TIER_1_BALANCE) {
            return 500;
        } else if (balance >= TIER_2_BALANCE) {
            return 250;
        } else if (balance >= TIER_3_BALANCE) {
            return 100;
        } else {
            return 0;
        }
    }
    
    /**
     * @dev Calculate deposit boost: +50 points per 0.1 ETH, max 400
     */
    function _calculateDepositBoost(uint256 totalDeposited) internal pure returns (uint256) {
        // Calculate number of 0.1 ETH units deposited
        uint256 units = totalDeposited / DEPOSIT_SCORE_UNIT;
        uint256 boost = units * DEPOSIT_SCORE_POINTS;
        
        // Cap at MAX_DEPOSIT_BOOST (400)
        if (boost > MAX_DEPOSIT_BOOST) {
            boost = MAX_DEPOSIT_BOOST;
        }
        
        return boost;
    }
    
    /**
     * @dev Calculate repayment boost: +10 points per repayment (simplified: per 0.01 ETH repaid)
     * @notice For simplicity, we award +10 points per 0.01 ETH repaid, max 100 points
     */
    function _calculateRepaymentBoost(uint256 totalRepaid) internal pure returns (uint256) {
        // +10 points per 0.01 ETH repaid
        uint256 units = totalRepaid / 0.01 ether;
        uint256 boost = units * REPAYMENT_SCORE_POINTS;
        
        // Cap at MAX_REPAYMENT_BOOST (100)
        if (boost > MAX_REPAYMENT_BOOST) {
            boost = MAX_REPAYMENT_BOOST;
        }
        
        return boost;
    }
}
