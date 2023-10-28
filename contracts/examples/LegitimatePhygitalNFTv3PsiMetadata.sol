// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/LockedNFT/extensions/LGTServiced721Psi.sol";
import "./LegitimateNFTMetadata.sol";

contract LegitimatePhygitalNFTv3PsiMetadata is LegitimateNFTMetadata, LGTServiced721Psi {
    using Strings for uint256;

    constructor(string memory name_, string memory symbol_) LGTServiced721Psi(name_, symbol_) {}

    // This generates the metadata on-chain for each NFT so metadata files do not need to be hosted
    // and unlimited number of NFTs can be minted
    function tokenURI(uint256 tokenId) public view virtual override(ERC721Psi, LegitimateNFTMetadata) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(LGTServiced721Psi, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
