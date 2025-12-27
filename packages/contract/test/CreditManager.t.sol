// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CreditManager} from "../src/CreditManager.sol";
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

contract CreditManagerTest is Test {
    CreditManager public creditManager;
    MockEAS public mockEAS;
    bytes32 public constant COINBASE_SCHEMA = keccak256("COINBASE_VERIFICATION");
    
    address public user = address(0x1);
    
    function setUp() public {
        mockEAS = new MockEAS();
        creditManager = new CreditManager(address(mockEAS), COINBASE_SCHEMA);
    }
    
    function testBaseCreditScore() public {
        uint256 score = creditManager.getCreditScore(user);
        assertEq(score, 0); // Credit score is 0 until an attestation is registered
    }
    
    function testRegisterAttestation() public {
        bytes32 attestationUID = keccak256("TEST_ATTESTATION");
        
        // Create attestation in mock EAS
        vm.prank(address(0x2)); // attester
        mockEAS.createAttestation(attestationUID, user, COINBASE_SCHEMA, 0);
        
        // Register attestation
        vm.prank(user);
        creditManager.registerAttestation(attestationUID);
        
        // Check credit score increased
        uint256 score = creditManager.getCreditScore(user);
        assertEq(score, 300); // BASE_CREDIT_SCORE * COINBASE_VERIFIED_MULTIPLIER
        
        // Check credit limit
        uint256 limit = creditManager.getCreditLimit(user);
        assertEq(limit, 300000); // 300 * 1000
    }
    
    function testHasCoinbaseVerification() public {
        bytes32 attestationUID = keccak256("TEST_ATTESTATION");
        
        // Create attestation
        vm.prank(address(0x2));
        mockEAS.createAttestation(attestationUID, user, COINBASE_SCHEMA, 0);
        
        // Register attestation
        vm.prank(user);
        creditManager.registerAttestation(attestationUID);
        
        // Check verification
        assertTrue(creditManager.hasCoinbaseVerification(user));
    }
}

