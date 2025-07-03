// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/ECHOToken.sol";
import "../contracts/DistributorUpgradeable.sol";

contract SimpleDeployECHO is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        address signerAddress = vm.envOr("SIGNER_ADDRESS", deployerAddress);

        console.log("Deploying ECHO Token on Worldchain (Chain ID: 480)");
        console.log("Deployer:", deployerAddress);
        console.log("Balance:", deployerAddress.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ECHO Token implementation
        console.log("\nDeploying ECHO Token implementation...");
        ECHOToken echoImplementation = new ECHOToken();
        console.log("ECHO Implementation:", address(echoImplementation));

        // 2. Deploy ECHO Token Proxy
        console.log("\nDeploying ECHO Token proxy...");
        bytes memory echoInitData = abi.encodeWithSelector(
            ECHOToken.initialize.selector,
            deployerAddress
        );
        
        ERC1967Proxy echoProxy = new ERC1967Proxy(
            address(echoImplementation),
            echoInitData
        );
        console.log("ECHO Proxy:", address(echoProxy));

        // 3. Set token URI
        console.log("\nSetting token URI...");
        ECHOToken(address(echoProxy)).setTokenURI("ipfs://bafkreidgqonfwdicpbe2rxfkejumxo33s6wl63bq6qigjdgc4xlvctcsfi");

        // 4. Deploy Distributor implementation
        console.log("\nDeploying Distributor implementation...");
        DistributorUpgradeable distributorImplementation = new DistributorUpgradeable();
        console.log("Distributor Implementation:", address(distributorImplementation));

        // 5. Deploy Distributor Proxy
        console.log("\nDeploying Distributor proxy...");
        bytes memory distributorInitData = abi.encodeWithSelector(
            DistributorUpgradeable.initialize.selector,
            address(echoProxy),
            signerAddress,
            deployerAddress
        );
        
        ERC1967Proxy distributorProxy = new ERC1967Proxy(
            address(distributorImplementation),
            distributorInitData
        );
        console.log("Distributor Proxy:", address(distributorProxy));

        vm.stopBroadcast();

        // Print final summary
        console.log("\n========== DEPLOYMENT COMPLETE ==========");
        console.log("ECHO Token Proxy:", address(echoProxy));
        console.log("ECHO Token Implementation:", address(echoImplementation));
        console.log("Distributor Proxy:", address(distributorProxy));
        console.log("Distributor Implementation:", address(distributorImplementation));
        console.log("==========================================");
        console.log("\nSAVE THESE ADDRESSES!");
    }
} 