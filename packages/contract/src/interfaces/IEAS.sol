// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import Attestation struct from Common.sol
import "@eas/contracts/Common.sol";

/**
 * @title EAS - Ethereum Attestation Service Interface
 * @notice Simplified interface for EAS attestation checking
 */
interface IEAS {
    /**
     * @notice Returns whether an attestation exists
     * @param uid The unique identifier of the attestation
     * @return Whether the attestation exists
     */
    function isAttestationValid(bytes32 uid) external view returns (bool);

    /**
     * @notice Gets the attestation data
     * @param uid The unique identifier of the attestation
     * @return The attestation struct
     */
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

