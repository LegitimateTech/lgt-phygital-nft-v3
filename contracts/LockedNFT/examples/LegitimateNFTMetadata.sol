// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "contracts/Roles/NFTManagerAccessControl.sol";

abstract contract LegitimateNFTMetadata is NFTManagerAccessControl {
    using Strings for uint256;

    // METADATA
    string public nftTitle = "LGT Example NFT"; // Title of the NFT collection
    string public nftDescription = "This is an example NFT"; // Description in string or markdown format
    string public nftAnimationUri = ""; // IPFS or HTTP URL
    string public nftImageUri = "https://ipfs.legitimate.tech/ipfs/QmZxHi87WSABAC2Sh4HWckVgTwXrW4GuVHF7f6LnssG5GU"; // IPFS or HTTP URL
    bool public isNumbered = true; // displays the number in the title of the NFT

    // SET NFT METADATA
    function setNftTitle(string memory newTitle) public onlyNftManager {
        nftTitle = newTitle;
    }

    function setNftDescription(string memory newDescription) public onlyNftManager {
        nftDescription = newDescription;
    }

    function setNftAnimationUri(string memory newAnimationUri) public onlyNftManager {
        nftAnimationUri = newAnimationUri;
    }

    function setNftImageUri(string memory newImageUri) public onlyNftManager {
        nftImageUri = newImageUri;
    }

    function setIsNumbered(bool newIsNumbered) public onlyNftManager {
        isNumbered = newIsNumbered;
    }

    function _tokenURI(uint256 tokenId) internal view virtual returns (string memory) {
        string memory title = nftTitle;

        if (isNumbered) {
          title = string(abi.encodePacked(nftTitle, " #", tokenId.toString()));
        }

        // individual token metadata filename is just the numbered tokenId
        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "', title, '",',
                '"description": "', nftDescription, '",',
                '"image": "', nftImageUri, '",',
                '"animation_url": "', nftAnimationUri, '"',
            '}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
      return _tokenURI(tokenId);
    }
}
