// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../contracts/ECHOToken.sol";
import "../contracts/DistributorUpgradeable.sol";

contract DeployUpgradableContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Optional: get signer address from env or use deployer
        address signerAddress = vm.envOr("SIGNER_ADDRESS", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying contracts with:");
        console.log("Deployer:", deployerAddress);
        console.log("Signer:", signerAddress);

        // 1. Deploy ECHO Token implementation
        ECHOToken echoImplementation = new ECHOToken();
        console.log("ECHO Token Implementation deployed at:", address(echoImplementation));

        // 2. Deploy ECHO Token Proxy and initialize
        bytes memory echoInitData = abi.encodeWithSelector(
            ECHOToken.initialize.selector,
            deployerAddress
        );
        
        ERC1967Proxy echoProxy = new ERC1967Proxy(
            address(echoImplementation),
            echoInitData
        );
        console.log("ECHO Token Proxy deployed at:", address(echoProxy));

        // 3. Set token URI
        ECHOToken echoToken = ECHOToken(address(echoProxy));
        echoToken.setTokenURI("ipfs://bafkreidgqonfwdicpbe2rxfkejumxo33s6wl63bq6qigjdgc4xlvctcsfi");

        // 4. Deploy Distributor implementation
        DistributorUpgradeable distributorImplementation = new DistributorUpgradeable();
        console.log("Distributor Implementation deployed at:", address(distributorImplementation));

        // 5. Deploy Distributor Proxy and initialize
        bytes memory distributorInitData = abi.encodeWithSelector(
            DistributorUpgradeable.initialize.selector,
            address(echoProxy), // token address
            signerAddress,      // signer address
            deployerAddress     // owner address
        );
        
        ERC1967Proxy distributorProxy = new ERC1967Proxy(
            address(distributorImplementation),
            distributorInitData
        );
        console.log("Distributor Proxy deployed at:", address(distributorProxy));

        // 6. Transfer tokens to distributor (optional)
        // uint256 distributorAmount = 100_000_000_000 * 10**18; // 100 billion tokens
        // echoToken.transfer(address(distributorProxy), distributorAmount);
        // console.log("Transferred", distributorAmount / 10**18, "ECHO tokens to Distributor");

        vm.stopBroadcast();

        // Print summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("ECHO Token (Proxy):", address(echoProxy));
        console.log("ECHO Token (Implementation):", address(echoImplementation));
        console.log("Distributor (Proxy):", address(distributorProxy));
        console.log("Distributor (Implementation):", address(distributorImplementation));
        console.log("=========================\n");

        // Save deployment addresses to file
        _saveDeploymentAddresses(
            address(echoProxy),
            address(echoImplementation),
            address(distributorProxy),
            address(distributorImplementation)
        );
    }

    function _saveDeploymentAddresses(
        address echoProxy,
        address echoImpl,
        address distProxy,
        address distImpl
    ) internal {
        string memory obj = "deployment";
        vm.serializeAddress(obj, "echoTokenProxy", echoProxy);
        vm.serializeAddress(obj, "echoTokenImplementation", echoImpl);
        vm.serializeAddress(obj, "distributorProxy", distProxy);
        string memory finalJson = vm.serializeAddress(obj, "distributorImplementation", distImpl);
        
        vm.writeJson(finalJson, "./deployments/latest.json");
    }
} 