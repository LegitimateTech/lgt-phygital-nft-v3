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
    }

    function setShouldPreventTransferWhenLocked(bool lock) external onlyAdmin {
      shouldPreventTransferWhenLocked = lock;
    }

    function getShouldPreventTransferWhenLocked() external view returns (bool) {
      return shouldPreventTransferWhenLocked;
    }

    // TOKENLOCK FUNCTIONS
    function _setTokenLock(uint256 _tokenId, bool _locked) internal {
      tokenLock[_tokenId] = _locked;
      if (_locked) {
        emit Locked(_tokenId);
      } else {
        emit Unlocked(_tokenId);
      }
    }

    function setTokenLock(uint256 _tokenId, bool _locked) override external onlyApiDelegate {
      _setTokenLock(_tokenId, _locked);
    }

    // READ TOKENLOCK STATE FUNCTIONS
    function _getTokenLock(uint256 _tokenId) internal virtual view returns (bool) {
      return tokenLock[_tokenId];
    }

    // @notice DEPRECATED: This is a helper function to support existing functionality in dApps prior to implementing ERC-5192
    // @dev For external calls, use locked(uint256 tokenId) instead
    function getTokenLock(uint256 tokenId) override external view returns (bool) {
      return _getTokenLock(tokenId);
    }

    function locked(uint256 tokenId) override external view returns (bool) {
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
        (bytes4(keccak256("claim(address,uint256)")) == msg.sig) || // this transfer is a call to claim
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

    function supportsInterface(bytes4 interfaceId) override virtual public view returns(bool) {
      return super.supportsInterface(interfaceId) || interfaceId == type(IERC5192).interfaceId;
    }
}
