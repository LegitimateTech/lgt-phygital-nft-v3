// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "contracts/LockedNFT/extensions/LGTServiced721.sol";
import "contracts/LockedNFT/extensions/LGTNFTRoyalty.sol";

contract LegitimatePhygitalNFTv3 is LGTServiced721, LGTNFTRoyalty, ERC721Burnable, ERC721Enumerable {
    using Strings for uint256;

    // METADATA
    string public baseURI = "https://metadata.legitimate.tech/example";

    constructor() ERC721("LGTPhygitalNFTv3Example", "LGTNFTv3Example") {
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI) public onlyNftManager {
        baseURI = newURI;
    }

    // IPFS folder or other HTTP server that holds NFT metadata in the form of
    // base uri = `https://ipfs.io/ipfs/<folder-hash>/` or whatever gateway we wish to use
    // folder contains files `1, 2, 3, ..., locked` metadata json files
    // could also be an AWS bucket or folder on some other HTTP server as well
    function tokenURI(uint256 tokenId) public view virtual override(ERC721) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        // individual token metadata filename is just the numbered tokenId
        string memory baseTokenUri = string(abi.encodePacked(baseURI, "/", tokenId.toString()));

        // the contract shares a single locked metadata file, filename is `locked`
        if (tokenLock[tokenId]) {
          return string(abi.encodePacked(baseURI, "/locked"));
        }

        return baseTokenUri;
    }

    // The following functions are overrides required by Solidity for ERC-165
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721, LGTNFTRoyalty, LGTServiced721, ERC721Enumerable)
    returns (bool)
    {
      return LGTServiced721.supportsInterface(interfaceId) || ERC721Enumerable.supportsInterface(interfaceId);
    }

    function _afterTokenTransfer(address from, address to, uint256 startTokenId, uint256 quantity) override(ERC721, Locked721) internal virtual {
      Locked721._afterTokenTransfer(from, to, startTokenId, quantity);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    virtual
    override(ERC721, Locked721, ERC721Enumerable)
    {
      ERC721Enumerable._beforeTokenTransfer(from, to, tokenId, batchSize);
      Locked721._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721Royalty) {
      super._burn(tokenId);
    }
}
