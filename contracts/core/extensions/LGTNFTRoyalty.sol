// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "./LGTAccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";

abstract contract LGTNFTRoyalty is ERC721Royalty, LGTAccessControl {
    function mint(uint256 tokenId, address to, address feeReceiver, uint96 feeNumerator) public onlyNftManager{
      _safeMint(to, tokenId);
      _setTokenRoyalty(tokenId, feeReceiver, feeNumerator);
    }

    // ROYALTY FUNCTIONS
    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public onlyNftManager {
      _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyNftManager {
      _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() public onlyNftManager{
      _deleteDefaultRoyalty();
    }

    function resetTokenRoyalty(uint256 tokenId) public onlyNftManager {
      _resetTokenRoyalty(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(AccessControl, ERC721Royalty)
    returns (bool)
    {
        return AccessControl.supportsInterface(interfaceId) || ERC721Royalty.supportsInterface(interfaceId);
    }
}
