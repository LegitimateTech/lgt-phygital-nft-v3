// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract LGTAccessControl is AccessControl {
    using Strings for uint256;

    // ROLES
    // role for partners to mint NFTs, manage metadata, set royalties, and manage whitelisted marketplaces
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_USER");
    // role for managing service status of the contract
    bytes32 public constant SERVICE_STATUS_ROLE = keccak256("SERVICE_STATUS_MANAGER_USER");
    // role for recovery of NFTs if physical item is returned
    // @IMPORTANT: Comment out the line below if token recovery is not needed
    bytes32 public constant TOKEN_RECOVERY_ROLE = keccak256("TOKEN_RECOVERY_USER");

    // ACCESS CONTROL
    modifier onlyNftManager() {
      require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have permission to manage NFTs");
      _;
    }

    modifier onlyServiceStatusManager() {
      require(hasRole(SERVICE_STATUS_ROLE, msg.sender), "Caller does not have permission to set the service status of this contract");
      _;
    }

    // @IMPORTANT: Comment out the line below if token recovery is not needed
    modifier onlyTokenRecoveryUser() {
      require(hasRole(TOKEN_RECOVERY_ROLE, msg.sender), "Caller does not have permission to recover NFTs");
      _;
    }
}