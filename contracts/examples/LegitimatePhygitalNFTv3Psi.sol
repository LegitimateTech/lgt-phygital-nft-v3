// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/LockedNFT/extensions/LGTServiced721Psi.sol";

contract LegitimatePhygitalNFTv3Psi is LGTServiced721Psi {
    using Strings for uint256;

    // METADATA
    string public baseURI = "";

    constructor(string memory name_, string memory symbol_) LGTServiced721Psi(name_, symbol_) {}

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI) public onlyNftManager {
        baseURI = newURI;
    }

    // IPFS folder or other HTTP server that holds NFT metadata in the form of
    // base uri = `https://ipfs.io/ipfs/<folder-hash>/` or whatever gateway we wish to use
    // folder contains files `1, 2, 3, ...` metadata json files
    // could also be an AWS bucket or folder on some other HTTP server as well
    function tokenURI(uint256 tokenId) public view virtual override(ERC721Psi) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        // individual token metadata filename is just the numbered tokenId
        return string(abi.encodePacked(baseURI, "/", tokenId.toString()));
    }
}
