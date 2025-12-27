// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ERC20Mock} from "@openzeppelin/contracts/mocks/token/ERC20Mock.sol";
import {CreditManager} from "../src/CreditManager.sol";
import {LendingPool} from "../src/LendingPool.sol";
import {IEAS} from "../src/interfaces/IEAS.sol";
import {Attestation} from "@eas/contracts/Common.sol";

// Mock EAS contract for testing
contract MockEAS is IEAS {
    mapping(bytes32 => AttestationData) public attestations;
    
    struct AttestationData {
        address recipient;
        address attester;
        bytes32 schema;
        bytes data;
        uint64 expirationTime;
        uint64 revocationTime;
        bool revocable;
        bool exists;
    }
    
    function createAttestation(
        bytes32 uid,
        address recipient,
        bytes32 schema,
        uint64 expirationTime
    ) external {
        attestations[uid] = AttestationData({
            recipient: recipient,
            attester: msg.sender,
            schema: schema,
            data: "",
            expirationTime: expirationTime,
            revocationTime: 0,
            revocable: true,
            exists: true
        });
    }
    
    function isAttestationValid(bytes32 uid) external view override returns (bool) {
        return attestations[uid].exists && attestations[uid].revocationTime == 0;
    }
    
    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        AttestationData memory att = attestations[uid];
        require(att.exists, "Attestation does not exist");
        
        return Attestation({
            uid: uid,
            schema: att.schema,
            time: uint64(block.timestamp),
            expirationTime: att.expirationTime,
            revocationTime: att.revocationTime,
            refUID: bytes32(0),
            recipient: att.recipient,
            attester: att.attester,
            revocable: att.revocable,
            data: att.data
        });
    }
}

contract TrustPulseTest is Test {
    CreditManager public creditManager;
    LendingPool public lendingPool;
    MockEAS public mockEAS;
    ERC20Mock public usdcToken;
    
    bytes32 public constant COINBASE_SCHEMA = 0x2921a44c92572b8417643f055655079a4073d87532353a479d494101d29d9196;
    
    address public userVerified = address(0x1);
    address public userUnverified = address(0x2);
    address public attester = address(0x3);
    
    // Test constants
    uint256 public constant ETH_DEPOSIT = 1 ether; // 1 ETH
    uint256 public constant ETH_PRICE_USD = 3000e18; // $3000 per ETH
    
    function setUp() public {
        // Deploy Mock EAS
        mockEAS = new MockEAS();
        
        // Deploy CreditManager
        creditManager = new CreditManager(address(mockEAS), COINBASE_SCHEMA);
        
        // Deploy mock USDC (6 decimals)
        usdcToken = new ERC20Mock();
        
        // Deploy LendingPool
        lendingPool = new LendingPool(address(creditManager), address(usdcToken));
        
        // Setup verified user: Create and register attestation
        bytes32 attestationUID = keccak256("VERIFIED_USER_ATTESTATION");
        vm.prank(attester);
        mockEAS.createAttestation(attestationUID, userVerified, COINBASE_SCHEMA, 0);
        vm.prank(userVerified);
        creditManager.registerAttestation(attestationUID);
        
        // Verify setup
        assertTrue(creditManager.hasCoinbaseVerification(userVerified), "Verified user should have attestation");
        assertFalse(creditManager.hasCoinbaseVerification(userUnverified), "Unverified user should not have attestation");
        
        // Check LTV values
        uint256 ltvVerified = creditManager.getLTV(userVerified);
        uint256 ltvUnverified = creditManager.getLTV(userUnverified);
        assertEq(ltvVerified, 80, "Verified user should have 80% LTV");
        assertEq(ltvUnverified, 50, "Unverified user should have 50% LTV");
    }
    
    function testVerifiedUserCanBorrow80Percent() public {
        // Deposit 1 ETH
        vm.deal(userVerified, ETH_DEPOSIT);
        vm.prank(userVerified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Calculate expected collateral value: 1 ETH * $3000 = $3000 (18 decimals)
        uint256 collateralValueUSD = lendingPool.getCollateralValueUSD(userVerified);
        assertEq(collateralValueUSD, ETH_PRICE_USD, "Collateral should be $3000");
        
        // Calculate max borrow: $3000 * 80% = $2400 (18 decimals)
        uint256 maxBorrow = lendingPool.getMaxBorrow(userVerified);
        uint256 expectedMaxBorrow = (ETH_PRICE_USD * 80) / 100; // $2400
        assertEq(maxBorrow, expectedMaxBorrow, "Max borrow should be $2400 (80% of $3000)");
        
        // Borrow 80% of collateral ($2400)
        vm.prank(userVerified);
        lendingPool.borrow(maxBorrow);
        
        // Verify borrow amount
        uint256 borrowAmount = lendingPool.getBorrow(userVerified);
        assertEq(borrowAmount, maxBorrow, "Borrow amount should match max borrow");
        
        // Try to borrow more (should fail)
        vm.prank(userVerified);
        vm.expectRevert("LendingPool: Exceeds max borrow");
        lendingPool.borrow(1e18); // Try to borrow $1 more
    }
    
    function testUnverifiedUserCanOnlyBorrow50Percent() public {
        // Deposit 1 ETH
        vm.deal(userUnverified, ETH_DEPOSIT);
        vm.prank(userUnverified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Calculate expected collateral value: 1 ETH * $3000 = $3000 (18 decimals)
        uint256 collateralValueUSD = lendingPool.getCollateralValueUSD(userUnverified);
        assertEq(collateralValueUSD, ETH_PRICE_USD, "Collateral should be $3000");
        
        // Calculate max borrow: $3000 * 50% = $1500 (18 decimals)
        uint256 maxBorrow = lendingPool.getMaxBorrow(userUnverified);
        uint256 expectedMaxBorrow = (ETH_PRICE_USD * 50) / 100; // $1500
        assertEq(maxBorrow, expectedMaxBorrow, "Max borrow should be $1500 (50% of $3000)");
        
        // Borrow 50% of collateral ($1500)
        vm.prank(userUnverified);
        lendingPool.borrow(maxBorrow);
        
        // Verify borrow amount
        uint256 borrowAmount = lendingPool.getBorrow(userUnverified);
        assertEq(borrowAmount, maxBorrow, "Borrow amount should match max borrow");
        
        // Try to borrow more (should fail)
        vm.prank(userUnverified);
        vm.expectRevert("LendingPool: Exceeds max borrow");
        lendingPool.borrow(1e18); // Try to borrow $1 more
    }
    
    function testVerifiedUserCannotBorrowMoreThan80Percent() public {
        // Deposit 1 ETH
        vm.deal(userVerified, ETH_DEPOSIT);
        vm.prank(userVerified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Calculate max borrow: $3000 * 80% = $2400
        uint256 maxBorrow = lendingPool.getMaxBorrow(userVerified);
        
        // Try to borrow more than 80% (should fail)
        uint256 excessBorrow = maxBorrow + 1e18; // $1 more than max
        vm.prank(userVerified);
        vm.expectRevert("LendingPool: Exceeds max borrow");
        lendingPool.borrow(excessBorrow);
    }
    
    function testUnverifiedUserCannotBorrowMoreThan50Percent() public {
        // Deposit 1 ETH
        vm.deal(userUnverified, ETH_DEPOSIT);
        vm.prank(userUnverified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Calculate max borrow: $3000 * 50% = $1500
        uint256 maxBorrow = lendingPool.getMaxBorrow(userUnverified);
        
        // Try to borrow more than 50% (should fail)
        uint256 excessBorrow = maxBorrow + 1e18; // $1 more than max
        vm.prank(userUnverified);
        vm.expectRevert("LendingPool: Exceeds max borrow");
        lendingPool.borrow(excessBorrow);
    }
    
    function testLTVValues() public {
        // Test LTV values directly from CreditManager
        uint256 ltvVerified = creditManager.getLTV(userVerified);
        uint256 ltvUnverified = creditManager.getLTV(userUnverified);
        
        assertEq(ltvVerified, 80, "Verified user LTV should be 80%");
        assertEq(ltvUnverified, 50, "Unverified user LTV should be 50%");
    }
    
    function testBorrowCalculation() public {
        // Deposit 1 ETH for verified user
        vm.deal(userVerified, ETH_DEPOSIT);
        vm.prank(userVerified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Collateral: $3000
        // LTV: 80%
        // Max borrow: $3000 * 0.8 = $2400
        
        uint256 collateral = lendingPool.getCollateralValueUSD(userVerified);
        uint256 ltv = creditManager.getLTV(userVerified);
        uint256 maxBorrow = lendingPool.getMaxBorrow(userVerified);
        
        uint256 calculatedMaxBorrow = (collateral * ltv) / 100;
        
        assertEq(maxBorrow, calculatedMaxBorrow, "Max borrow calculation should match");
        assertEq(maxBorrow, 2400e18, "Max borrow should be exactly $2400");
    }
    
    function testUnverifiedBorrowCalculation() public {
        // Deposit 1 ETH for unverified user
        vm.deal(userUnverified, ETH_DEPOSIT);
        vm.prank(userUnverified);
        lendingPool.depositETH{value: ETH_DEPOSIT}();
        
        // Collateral: $3000
        // LTV: 50%
        // Max borrow: $3000 * 0.5 = $1500
        
        uint256 collateral = lendingPool.getCollateralValueUSD(userUnverified);
        uint256 ltv = creditManager.getLTV(userUnverified);
        uint256 maxBorrow = lendingPool.getMaxBorrow(userUnverified);
        
        uint256 calculatedMaxBorrow = (collateral * ltv) / 100;
        
        assertEq(maxBorrow, calculatedMaxBorrow, "Max borrow calculation should match");
        assertEq(maxBorrow, 1500e18, "Max borrow should be exactly $1500");
    }
}

