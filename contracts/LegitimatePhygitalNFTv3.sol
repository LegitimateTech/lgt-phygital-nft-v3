// SPDX-License-Identifier: Unlicense
/*
* @custom:dev-run-script npm run test
*/
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Strings.sol";
import "contracts/core/LGTServiced721Psi.sol";

contract LegitimatePhygitalNFTv3 is LGTServiced721Psi {
    using Strings for uint256;

    // METADATA
    string public baseURI = "https://metadata.legitimate.tech/example";

    constructor() ERC721Psi("LGTPhygitalNFTv3Example", "LGTNFTv3Example") {
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
    function tokenURI(uint256 tokenId) public view virtual override(ERC721Psi) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        // individual token metadata filename is just the numbered tokenId
        string memory baseTokenUri = string(abi.encodePacked(baseURI, "/", tokenId.toString()));

        // the contract shares a single locked metadata file, filename is `locked`
        if (tokenLock[tokenId]) {
          return string(abi.encodePacked(baseURI, "/locked"));
        }

        return baseTokenUri;
    }
}
