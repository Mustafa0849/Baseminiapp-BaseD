// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {CreditManager} from "../src/CreditManager.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {MockEAS} from "./CreditManager.t.sol";

contract LendingPoolTest is Test {
    LendingPool public lendingPool;
    CreditManager public creditManager;
    MockEAS public mockEAS;
    ERC20Mock public token;
    
    bytes32 public constant COINBASE_SCHEMA = keccak256("COINBASE_VERIFICATION");
    address public user = address(0x1);
    address public owner = address(0x2);
    
    function setUp() public {
        mockEAS = new MockEAS();
        creditManager = new CreditManager(address(mockEAS), COINBASE_SCHEMA);
        token = new ERC20Mock();
        
        // Deploy LendingPool as owner so owner becomes the contract owner
        vm.startPrank(owner);
        lendingPool = new LendingPool(address(creditManager), address(token));
        
        // Add token as supported (for future use)
        lendingPool.addSupportedToken(address(token), 8000); // 80% max LTV
        vm.stopPrank();
    }
    
    function testDeposit() public {
        // Test USDC deposit (token has 18 decimals in mock, but USDC should have 6)
        // For testing, we'll use the token as USDC with proper scaling
        uint256 amount = 1000e6; // 1000 USDC (6 decimals)
        token.mint(user, amount);
        
        vm.startPrank(user);
        token.approve(address(lendingPool), amount);
        lendingPool.depositUSDC(amount);
        vm.stopPrank();
        
        assertEq(lendingPool.usdcDeposits(user), amount);
    }
    
    function testBorrowWithCreditLimit() public {
        // Setup: User has Coinbase verification
        bytes32 attestationUID = keccak256("TEST_ATTESTATION");
        vm.prank(address(0x3));
        mockEAS.createAttestation(attestationUID, user, COINBASE_SCHEMA, 0);
        vm.prank(user);
        creditManager.registerAttestation(attestationUID);
        
        // User has credit limit of 300000
        uint256 creditLimit = creditManager.getCreditLimit(user);
        assertEq(creditLimit, 300000);
        
        // Deposit ETH as collateral first
        uint256 ethDeposit = 1 ether;
        vm.deal(user, ethDeposit);
        vm.prank(user);
        lendingPool.depositETH{value: ethDeposit}();
        
        // Calculate max borrow based on collateral and LTV
        uint256 maxBorrow = lendingPool.getMaxBorrow(user);
        require(maxBorrow > 0, "Max borrow should be greater than 0");
        
        // Borrow a portion (in USD, 18 decimals)
        uint256 borrowAmount = maxBorrow / 2; // Borrow 50% of max
        
        vm.prank(user);
        lendingPool.borrow(borrowAmount);
        
        assertEq(lendingPool.borrows(user), borrowAmount);
    }
    
    function testGetUserMaxLTV() public {
        // User without verification - should have 50% LTV from CreditManager
        uint256 ltv = creditManager.getLTV(user);
        assertEq(ltv, 50); // 50% LTV for unverified users
        
        // User with verification - should have 80% LTV from CreditManager
        bytes32 attestationUID = keccak256("TEST_ATTESTATION");
        vm.prank(address(0x3));
        mockEAS.createAttestation(attestationUID, user, COINBASE_SCHEMA, 0);
        vm.prank(user);
        creditManager.registerAttestation(attestationUID);
        
        ltv = creditManager.getLTV(user);
        assertEq(ltv, 80); // 80% LTV for verified users
        
        // Verify supported token maxLTV is stored
        uint256 tokenMaxLTV = lendingPool.supportedTokens(address(token));
        assertEq(tokenMaxLTV, 8000); // 80% stored in basis points
    }
}

