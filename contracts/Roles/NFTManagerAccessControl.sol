// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract NFTManagerAccessControl is AccessControl {
    using Strings for uint256;

    // ROLES
    // role for partners to mint NFTs, manage metadata, set royalties, and manage whitelisted marketplaces
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_USER");

    // ACCESS CONTROL
    modifier onlyNftManager() {
      require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have permission to manage NFTs");
      _;
    }
}
