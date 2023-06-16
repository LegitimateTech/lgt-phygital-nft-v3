// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "./ILocked721Base.sol";
import "./Locked721AccessControl.sol";

abstract contract Locked721Base is ILocked721Base, Locked721AccessControl {
    // stores the locked state for each NFT
    mapping(uint256 => bool) tokenLock;

    // 
    bool private shouldLockTokensAfterMint = true;

    // this governs the transfer lock functionality
    // when the token is in a locked state after the transfer, the token cannot be transferred again
    // until it has been unlocked by tapping the LGT tag and submitting the chip's signature to the API
    // this effectively turns the NFT into a semi soul bound NFT and prevents the NFT from being traded
    // without transferring the physical item to the new owner as well
    bool private shouldPreventTransferWhenLocked = true;

    constructor() {
      // contract deployer is the admin by default
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      // contract deployer can be granted some initial roles to start with
      _setupRole(API_DELEGATE_ROLE, msg.sender);

      // set default admin as the manager of claim and unlock delegate roles
      _setRoleAdmin(API_DELEGATE_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function setShouldPreventTransferWhenLocked(bool lock) external onlyAdmin {
      shouldPreventTransferWhenLocked = lock;
    }

    function getShouldPreventTransferWhenLocked() external returns (bool) {
      return shouldPreventTransferWhenLocked;
    }

    // TOKENLOCK FUNCTIONS
    function _setTokenLock(uint256 tokenId, bool locked) internal {
      tokenLock[tokenId] = locked;
    }

    function setTokenLock(uint256 tokenId, bool locked) override external onlyApiDelegate {
      _setTokenLock(tokenId, locked);
    }

    // READ TOKENLOCK STATE FUNCTIONS
    function _getTokenLock(uint256 tokenId) internal virtual view returns (bool) {
      return tokenLock[tokenId];
    }

    function getTokenLock(uint256 tokenId) override external view returns (bool) {
      return _getTokenLock(tokenId);
    }

    function setShouldLockTokensAfterMint(bool _shouldLockTokensAfterMint) external onlyAdmin {
      shouldLockTokensAfterMint = _shouldLockTokensAfterMint;
    }

    function getShouldLockTokensAfterMint() external view returns (bool) {
      return shouldLockTokensAfterMint;
    }

    // if a token is locked, then this function returns true, 
    // unless the token is being minted,
    // or the message sender has an API DELEGATE role and is claiming the token,
    // or the token is being burned 
    function _shouldPreventTokenTransfer (address from, address to, uint256 startTokenId, uint256 batchSize) internal virtual view returns (bool) {
      // do not prevent token transfer if:
      if (
        !shouldPreventTransferWhenLocked || // flag for preventing token transfers
        from == address(0) || // token is being minted
        (from == msg.sender && hasRole(API_DELEGATE_ROLE, msg.sender)) || // transfer is being initiated by API_DELEGATE_ROLE
        to == address(0) // token is being burned
      ) {
        return false;
      }
      for (uint256 i=0; i<batchSize; i++) {
        if (_getTokenLock(startTokenId + i)) {
          return true;
        }
      }
      return false;
    }

    function _lockTokensAfterTransfer (address from, address, uint256 startTokenId, uint256 quantity) internal {
      if (from == address(0) && !shouldLockTokensAfterMint) {
         return;
      }
      for (uint256 i=0; i<quantity; i++) {
        _setTokenLock(startTokenId + i, true);
      }
    } 

    // This is used for end users to claim NFTs minted to our delegate wallet and makes the claim activation gasless for end users
    // the delegate wallet performing the claim functionality needs to own the NFT
    // we check the ownership information on our API service used by Tap
    function claim(address to, uint256 tokenId) override virtual external onlyApiDelegate {}
}
