// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CreditManager.sol";

/**
 * @title LendingPool
 * @author TrustPulse
 * @notice Production lending pool with LP share system, 10% APR, and treasury fees
 * @dev Uses CreditManager for tiered borrowing limits based on credit scores
 */
contract LendingPool is ReentrancyGuard, Ownable {
    // ============ Structs ============
    
    struct Loan {
        uint256 principal;        // Original borrowed amount
        uint256 timestamp;        // Loan start time
        bool isActive;            // Loan status
    }
    
    // ============ Constants ============
    
    /// @notice Annual interest rate: 10% (stored as basis points: 1000 = 10%)
    uint256 public constant INTEREST_RATE_BPS = 1000;
    
    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Seconds in a year (365 days)
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    /// @notice Treasury fee: 20% of interest (stored as basis points: 2000 = 20%)
    uint256 public constant TREASURY_FEE_BPS = 2000;
    
    /// @notice Initial share price multiplier (for precision)
    uint256 public constant SHARE_PRECISION = 1e18;
    
    // ============ State Variables ============
    
    /// @notice CreditManager contract reference
    CreditManager public immutable creditManager;
    
    /// @notice Total LP shares in circulation
    uint256 public totalShares;
    
    /// @notice LP shares per address
    mapping(address => uint256) public shares;
    
    /// @notice Active loans per borrower (one loan at a time)
    mapping(address => Loan) public loans;
    
    /// @notice Accumulated treasury fees (owner profit)
    uint256 public treasuryFees;
    
    /// @notice Total principal currently borrowed
    uint256 public totalBorrowed;
    
    // ============ Events ============
    
    event Deposit(address indexed provider, uint256 amount, uint256 sharesMinted);
    event Withdraw(address indexed provider, uint256 sharesBurned, uint256 amountReturned);
    event Borrow(address indexed borrower, uint256 principal, uint256 timestamp);
    event Repay(
        address indexed borrower, 
        uint256 principal, 
        uint256 interest, 
        uint256 treasuryFee, 
        uint256 lpInterest
    );
    event TreasuryWithdrawal(address indexed owner, uint256 amount);
    
    // Admin Transaction Log Events (simplified for monitoring)
    event LiquidityAdded(address indexed user, uint256 amount);
    event LoanTaken(address indexed user, uint256 amount);
    event LoanRepaid(address indexed user, uint256 amount, uint256 interest);
    
    // ============ Constructor ============
    
    /**
     * @notice Constructor
     * @param _creditManager The address of the CreditManager contract
     */
    constructor(address _creditManager) Ownable(msg.sender) {
        require(_creditManager != address(0), "LendingPool: Invalid CreditManager");
        creditManager = CreditManager(_creditManager);
    }
    
    // ============ LP Functions ============
    
    /**
     * @notice Deposit ETH and receive LP shares
     * @dev Also updates credit score via CreditManager
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "LendingPool: Amount must be > 0");
        
        uint256 sharesToMint;
        
        if (totalShares == 0) {
            // First deposit: 1:1 share ratio with precision
            sharesToMint = msg.value * SHARE_PRECISION;
        } else {
            // Calculate shares based on current pool value
            uint256 poolValue = getPoolValue();
            // shares = (deposit * totalShares) / poolValue
            sharesToMint = (msg.value * totalShares) / poolValue;
        }
        
        require(sharesToMint > 0, "LendingPool: Shares must be > 0");
        
        // Mint shares
        shares[msg.sender] += sharesToMint;
        totalShares += sharesToMint;
        
        // Update credit score for deposit (reward the LP)
        creditManager.updateScoreAfterDeposit(msg.sender, msg.value);
        
        emit Deposit(msg.sender, msg.value, sharesToMint);
        emit LiquidityAdded(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw ETH by burning LP shares
     * @param shareAmount The number of shares to burn
     */
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "LendingPool: Shares must be > 0");
        require(shares[msg.sender] >= shareAmount, "LendingPool: Insufficient shares");
        
        // Calculate ETH value of shares
        uint256 poolValue = getPoolValue();
        uint256 ethAmount = (shareAmount * poolValue) / totalShares;
        
        // Check available liquidity (exclude treasury fees)
        uint256 availableLiquidity = address(this).balance - treasuryFees;
        require(ethAmount <= availableLiquidity, "LendingPool: Insufficient liquidity");
        
        // Burn shares
        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        
        // Transfer ETH
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "LendingPool: ETH transfer failed");
        
        emit Withdraw(msg.sender, shareAmount, ethAmount);
    }
    
    // ============ Borrower Functions ============
    
    /**
     * @notice Borrow ETH based on credit score
     * @param amount The amount to borrow in wei
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: Amount must be > 0");
        require(!loans[msg.sender].isActive, "LendingPool: Repay existing loan first");
        
        // Verify credit profile is initialized
        require(creditManager.isProfileInitialized(msg.sender), "LendingPool: Initialize credit first");
        
        // Check borrow limit
        uint256 limit = creditManager.getBorrowLimit(msg.sender);
        require(limit > 0, "LendingPool: Score too low to borrow");
        require(amount <= limit, "LendingPool: Exceeds borrow limit");
        
        // Check pool liquidity (exclude treasury fees)
        uint256 availableLiquidity = address(this).balance - treasuryFees;
        require(amount <= availableLiquidity, "LendingPool: Insufficient pool liquidity");
        
        // Create loan
        loans[msg.sender] = Loan({
            principal: amount,
            timestamp: block.timestamp,
            isActive: true
        });
        
        totalBorrowed += amount;
        
        // Record borrow in CreditManager
        creditManager.recordBorrow(msg.sender, amount);
        
        // Transfer ETH to borrower
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "LendingPool: ETH transfer failed");
        
        emit Borrow(msg.sender, amount, block.timestamp);
        emit LoanTaken(msg.sender, amount);
    }
    
    /**
     * @notice Repay active loan with interest
     * @dev Interest = Principal * 10% APR * (time elapsed / 1 year)
     *      Fee split: 20% to treasury, 80% to LP pool
     */
    function repay() external payable nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "LendingPool: No active loan");
        
        // Calculate interest
        uint256 principal = loan.principal;
        uint256 interest = calculateInterest(principal, loan.timestamp);
        uint256 totalDue = principal + interest;
        
        require(msg.value >= totalDue, "LendingPool: Insufficient repayment");
        
        // Calculate fee split (20% treasury, 80% to pool)
        uint256 treasuryFee = (interest * TREASURY_FEE_BPS) / BPS_DENOMINATOR;
        uint256 lpInterest = interest - treasuryFee;
        
        // Update state
        loan.isActive = false;
        totalBorrowed -= principal;
        treasuryFees += treasuryFee;
        
        // Update credit score for successful repayment
        creditManager.updateScoreAfterRepayment(msg.sender, principal);
        
        // Return excess payment
        uint256 excess = msg.value - totalDue;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "LendingPool: Refund failed");
        }
        
        emit Repay(msg.sender, principal, interest, treasuryFee, lpInterest);
        emit LoanRepaid(msg.sender, principal, interest);
    }
    
    // ============ Owner Functions ============
    
    /**
     * @notice Withdraw accumulated treasury fees
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 fees = treasuryFees;
        require(fees > 0, "LendingPool: No fees to withdraw");
        
        treasuryFees = 0;
        
        (bool success, ) = owner().call{value: fees}("");
        require(success, "LendingPool: Fee withdrawal failed");
        
        emit TreasuryWithdrawal(owner(), fees);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Calculate interest for a loan
     * @param principal The loan principal
     * @param startTime The loan start timestamp
     * @return interest The accrued interest in wei
     */
    function calculateInterest(uint256 principal, uint256 startTime) public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - startTime;
        
        // Interest = Principal * Rate * Time / Year
        // interest = principal * (1000 / 10000) * (timeElapsed / SECONDS_PER_YEAR)
        uint256 interest = (principal * INTEREST_RATE_BPS * timeElapsed) / (BPS_DENOMINATOR * SECONDS_PER_YEAR);
        
        return interest;
    }
    
    /**
     * @notice Get the total value of the LP pool (excluding treasury fees)
     * @return The pool value in wei
     */
    function getPoolValue() public view returns (uint256) {
        // Pool value = contract balance - treasury fees
        // This includes: deposits + LP interest portion from repayments
        return address(this).balance - treasuryFees;
    }
    
    /**
     * @notice Get the current share price
     * @return The value of one share in wei (with SHARE_PRECISION decimals)
     */
    function getSharePrice() external view returns (uint256) {
        if (totalShares == 0) {
            return SHARE_PRECISION; // 1:1 initial ratio
        }
        return (getPoolValue() * SHARE_PRECISION) / totalShares;
    }
    
    /**
     * @notice Get LP share balance for an address
     * @param account The address to query
     * @return The number of shares held
     */
    function getShares(address account) external view returns (uint256) {
        return shares[account];
    }
    
    /**
     * @notice Get the ETH value of an account's shares
     * @param account The address to query
     * @return The ETH value of the account's shares
     */
    function getShareValue(address account) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[account] * getPoolValue()) / totalShares;
    }
    
    /**
     * @notice Get loan details for a user
     * @param user The address to query
     * @return The Loan struct
     */
    function getLoan(address user) external view returns (Loan memory) {
        return loans[user];
    }
    
    /**
     * @notice Get total amount due for a loan (principal + interest)
     * @param user The borrower address
     * @return The total amount due in wei
     */
    function getAmountDue(address user) external view returns (uint256) {
        Loan storage loan = loans[user];
        if (!loan.isActive) return 0;
        
        uint256 interest = calculateInterest(loan.principal, loan.timestamp);
        return loan.principal + interest;
    }
    
    /**
     * @notice Check if a user has an active loan
     * @param user The address to check
     * @return Whether the user has an active loan
     */
    function hasActiveLoan(address user) external view returns (bool) {
        return loans[user].isActive;
    }
    
    /**
     * @notice Get available liquidity for borrowing
     * @return The available ETH in the pool
     */
    function getAvailableLiquidity() external view returns (uint256) {
        return address(this).balance - treasuryFees;
    }
    
    // ============ Receive Function ============
    
    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
