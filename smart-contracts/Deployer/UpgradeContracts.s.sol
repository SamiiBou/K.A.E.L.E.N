// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "../contracts/ECHOToken.sol";
import "../contracts/DistributorUpgradeable.sol";

contract UpgradeContracts is Script {
    function upgradeECHOToken(address proxyAddress) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new implementation
        ECHOToken newImplementation = new ECHOToken();
        console.log("New ECHO Token Implementation deployed at:", address(newImplementation));
        
        // Upgrade proxy to new implementation
        ECHOToken proxy = ECHOToken(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), "");
        
        console.log("ECHO Token upgraded successfully");
        
        vm.stopBroadcast();
    }
    
    function upgradeDistributor(address proxyAddress) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy new implementation
        DistributorUpgradeable newImplementation = new DistributorUpgradeable();
        console.log("New Distributor Implementation deployed at:", address(newImplementation));
        
        // Upgrade proxy to new implementation
        DistributorUpgradeable proxy = DistributorUpgradeable(proxyAddress);
        proxy.upgradeToAndCall(address(newImplementation), "");
        
        console.log("Distributor upgraded successfully");
        
        vm.stopBroadcast();
    }
    
    // Convenience function to upgrade both contracts
    function upgradeAll(address echoProxy, address distributorProxy) external {
        upgradeECHOToken(echoProxy);
        upgradeDistributor(distributorProxy);
    }
} 