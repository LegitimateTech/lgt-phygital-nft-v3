// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract Locked721AccessControl is AccessControl {
    using Strings for uint256;

    // ROLES
    // role for server API to allow users to claim and unlock NFTs
    bytes32 public constant API_DELEGATE_ROLE = keccak256("API_DELEGATE_USER");

    // ACCESS CONTROL
    modifier onlyAdmin() {
      require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
      _;
    }

    modifier onlyApiDelegate() {
      require(hasRole(API_DELEGATE_ROLE, msg.sender), "Caller does not have permission to perform claim or unlock");
      _;
    }
}