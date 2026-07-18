// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/ChainLogger.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ChainLogger chainLogger = new ChainLogger(msg.sender);
        console.log("ChainLogger deployed to:", address(chainLogger));

        vm.stopBroadcast();
    }
}
