// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.18;

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
    function setNftTitle(string memory newTitle) external onlyNftManager {
        nftTitle = newTitle;
    }

    function setNftDescription(string memory newDescription) external onlyNftManager {
        nftDescription = newDescription;
    }

    function setNftAnimationUri(string memory newAnimationUri) external onlyNftManager {
        nftAnimationUri = newAnimationUri;
    }

    function setNftImageUri(string memory newImageUri) external onlyNftManager {
        nftImageUri = newImageUri;
    }

    function setIsNumbered(bool newIsNumbered) external onlyNftManager {
        isNumbered = newIsNumbered;
    }

    function _tokenURI(uint256 tokenId) internal view virtual returns (string memory) {
        string memory title = nftTitle;

        if (isNumbered) {
          title = string.concat(nftTitle, " #", tokenId.toString());
        }

        // individual token metadata filename is just the numbered tokenId
        string memory dataURI = string.concat(
            '{',
                '"name": "', title, '",',
                '"description": "', nftDescription, '",',
                '"image": "', nftImageUri, '",',
                '"animation_url": "', nftAnimationUri, '"',
            '}'
        );

        return string.concat(
                "data:application/json;base64,",
                string(Base64.encode(bytes(dataURI)))
        );
    }

    function tokenURI(uint256 tokenId) external view virtual returns (string memory) {
      return _tokenURI(tokenId);
    }
}
