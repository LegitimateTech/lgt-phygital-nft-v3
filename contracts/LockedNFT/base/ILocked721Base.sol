// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

/// @notice EIP-5192 Minimal Souldbound NFTs (https://eips.ethereum.org/EIPS/eip-5192)
/// @dev SBT Locked Token Interface
interface IERC5192 {
  /// @notice Emitted when the locking status is changed to locked.
  /// @dev If a token is minted and the status is locked, this event should be emitted.
  /// @param tokenId The identifier for a token.
  event Locked(uint256 tokenId);

  /// @notice Emitted when the locking status is changed to unlocked.
  /// @dev If a token is minted and the status is unlocked, this event should be emitted.
  /// @param tokenId The identifier for a token.
  event Unlocked(uint256 tokenId);

  /// @notice Returns the locking status of an Soulbound Token
  /// @dev SBTs assigned to zero address are considered invalid, and queries
  /// about them do throw.
  /// @param tokenId The identifier for an SBT.
  function locked(uint256 tokenId) external view returns (bool);
}

interface ILocked721Base is IERC5192 {
    // TOKENLOCK FUNCTIONS
    function setTokenLock(uint256 tokenId, bool locked) external;

    // This is used for end users to claim NFTs minted to our delegate wallet and makes the claim activation gasless for end users
    // the delegate wallet performing the claim functionality needs to own the NFT
    // we check the ownership information on our API service used by Tap
    function claim(address to, uint256 tokenId) external;
}
