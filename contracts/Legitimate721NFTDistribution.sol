// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "erc721psi/contracts/ERC721Psi.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract Legitimate721NFTDistribution is ERC721Psi, AccessControl {
    using Strings for uint256;

    // ROLES
    // role for Legitimate to distribute NFTs
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_USER");

    // METADATA
    string public nftTitle = "LGT Example NFT"; // Title of the NFT collection
    string public nftDescription = "This is an example NFT"; // Description in string or markdown format
    string public nftAnimationUri = ""; // IPFS or HTTP URL
    string public nftImageUri = "https://ipfs.legitimate.tech/ipfs/QmZxHi87WSABAC2Sh4HWckVgTwXrW4GuVHF7f6LnssG5GU"; // IPFS or HTTP URL
    bool public isNumbered = true; // displays the number in the title of the NFT
    bool public isSoulbound = true; // NFTs cannot be transferred once they are claimed

    constructor() ERC721Psi("LGT721NFTDistributionExample", "LGT721Distribution") {
      // contract deployer is the admin by default
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _setupRole(NFT_MANAGER_ROLE, msg.sender);
      _setRoleAdmin(NFT_MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // This generates the metadata on-chain for each NFT so metadata files do not need to be hosted
    // and unlimited number of NFTs can be minted
    function tokenURI(uint256 tokenId) public view virtual override(ERC721Psi) returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

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

    // ACCESS CONTROL
    modifier onlyNftManager() {
      require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have permission to manage NFTs");
      _;
    }

    // MINTING FUNCTIONS
    function mint(address to, uint256 quantity) public onlyNftManager {
      _safeMint(to, quantity);
    }

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

    function setIsSoulbound(bool newIsSoulbound) public onlyNftManager {
        isSoulbound = newIsSoulbound;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfers(address from, address to, uint256 tokenId, uint256 quantity)
    internal
    override(ERC721Psi)
    {
      require(!isSoulbound || from == address(0) || to == address(0), "Soulbound NFTs cannot be transferred");
      super._beforeTokenTransfers(from, to, tokenId, quantity);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Psi, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
