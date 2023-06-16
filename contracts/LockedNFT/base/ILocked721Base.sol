// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

interface ILocked721Base {
    // TOKENLOCK FUNCTIONS
    function setTokenLock(uint256 tokenId, bool locked) external;

    // READ TOKENLOCK STATE FUNCTIONS
    function getTokenLock(uint256 tokenId) external view returns (bool); 

    // This is used for end users to claim NFTs minted to our delegate wallet and makes the claim activation gasless for end users
    // the delegate wallet performing the claim functionality needs to own the NFT
    // we check the ownership information on our API service used by Tap
    function claim(address to, uint256 tokenId) external;
}
