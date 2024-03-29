// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "erc721psi/contracts/ERC721Psi.sol";
import "./base/Locked721Base.sol";

contract Locked721Psi is ERC721Psi, Locked721Base {
    constructor(string memory name_, string memory symbol_) ERC721Psi(name_,symbol_) {}

    // @todo: is not gas optimized since _afterTokenTransfer sets lock = true and then this sets lock = false
    // This is used for end users to claim NFTs minted to our delegate wallet and makes the claim activation gasless for end users
    // the delegate wallet performing the claim functionality needs to own the NFT
    // we check the ownership information on our API service used by Tap
    function claim(address to, uint256 tokenId) override external onlyApiDelegate {
      require(_isApprovedOrOwner(msg.sender, tokenId), 'Locked721Psi: Caller is not approved nor owner');

      _transfer(msg.sender, to, tokenId);
      _setTokenLock(tokenId, false);
    }

    function _startTokenId() override internal virtual pure returns (uint256) {
      return 1;
    }

    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity)
    internal
    virtual
    override(ERC721Psi)
    {
      require(!_shouldPreventTokenTransfer(from, to, startTokenId, quantity), "Please unlock your NFT by tapping the LGT Tag before transferring.");
      super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    // This locking mechanism disencentivizes people from separately selling the NFT without the physical item
    // in order to unlock. The owner of the NFT will need to unlock with the params generated by the LGT tag
    // and verified by LGT's servers. Since the unlock is done by LGT, the transaction is gasless for end users
    // and the gas is paid by Legitimate as part of the ongoing service contract.
    // Exclusive content and other experiences can also be gated behind this lock mechanism as well.
    function _afterTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) override(ERC721Psi) internal virtual {
      super._afterTokenTransfers(from, to, startTokenId, quantity);
      _lockTokensAfterTransfer(from, to, startTokenId, quantity);
    }

    // The following functions are overrides required by Solidity for ERC-165
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721Psi, Locked721Base)
    returns (bool)
    {
      return ERC721Psi.supportsInterface(interfaceId) || Locked721Base.supportsInterface(interfaceId);
    }
}
