// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {CreditManager} from "../src/CreditManager.sol";
import {LendingPool} from "../src/LendingPool.sol";

/**
 * @title DeployScript
 * @notice Production deployment script for TrustPulse lending protocol
 * @dev Deploy with: forge script script/Deploy.s.sol --rpc-url <RPC_URL> --broadcast
 */
contract DeployScript is Script {
    function run() external {
        // Retrieve PRIVATE_KEY from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("=== TrustPulse Protocol Deployment ===");
        console.log("Deployer:", deployer);
        console.log("");
        
        // Start broadcast
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy CreditManager
        console.log("Step 1: Deploying CreditManager...");
        CreditManager creditManager = new CreditManager();
        console.log("CreditManager deployed at:", address(creditManager));
        
        // 2. Deploy LendingPool
        console.log("Step 2: Deploying LendingPool...");
        LendingPool lendingPool = new LendingPool(address(creditManager));
        console.log("LendingPool deployed at:", address(lendingPool));
        
        // 3. Link contracts: Set LendingPool in CreditManager
        console.log("Step 3: Linking contracts...");
        creditManager.setLendingPool(address(lendingPool));
        console.log("LendingPool linked to CreditManager");
        
        // Stop broadcast
        vm.stopBroadcast();
        
        // Deployment summary
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("CreditManager:", address(creditManager));
        console.log("LendingPool:  ", address(lendingPool));
        console.log("");
        console.log("=== Protocol Configuration ===");
        console.log("Credit Score Scale: 0-1000");
        console.log("Interest Rate: 10% APR");
        console.log("Treasury Fee: 20% of interest");
        console.log("LP Fee: 80% of interest");
    }
}
