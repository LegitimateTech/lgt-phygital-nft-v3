// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract Legitimate1155NFTDistribution is ERC1155, AccessControl {
    using Strings for uint256;

    mapping(uint256 => uint256) private _totalSupply;
    uint256 private _collectionSupply = 0;

    // for OpenSea unidentified contract
    // https://stackoverflow.com/questions/68891144/how-to-fix-unidentified-contract-opensea-is-unable-to-understand-erc1155
    string public name = "";

    // METADATA
    string public nftTitle = ""; // Title of the NFT collection
    string public nftDescription = ""; // Description in string or markdown format
    string public nftAnimationUri = ""; // IPFS or HTTP URL
    string public nftImageUri = ""; // IPFS or HTTP URL
    bool public isNumbered = true; // displays the number in the title of the NFT
    bool public isSoulbound = true; // NFTs cannot be transferred once they are claimed

    // ERC1155Supply Modifications
    /**
     * @dev Total amount of tokens in with a given id.
     */
    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    /**
     * @dev Indicates whether any token exist with a given id, or not.
     */
    function exists(uint256 id) public view returns (bool) {
        return totalSupply(id) > 0;
    }

    function totalSupply() public view returns (uint256) {
        return _collectionSupply;
    }

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
        require(!isSoulbound || from == address(0) || to == address(0), "Soulbound NFTs cannot be transferred");


        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                _totalSupply[ids[i]] += amounts[i];
                _collectionSupply += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(supply >= amount, "ERC1155: burn amount exceeds totalSupply");
                unchecked {
                    _totalSupply[id] = supply - amount;
                    _collectionSupply -= amount;
                }
            }
        }
    }
    // END ERC1155Supply Modifications

    // ROLES
    // role for Legitimate to distribute NFTs
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_USER");

    constructor(string memory name_) ERC1155("") {
      name = name_;
      // contract deployer is the admin by default
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _setupRole(NFT_MANAGER_ROLE, msg.sender);
      _setRoleAdmin(NFT_MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // ACCESS CONTROL
    modifier onlyNftManager() {
      require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have permission to manage NFTs");
      _;
    }

    // MINTING FUNCTIONS
    function mint(address to, uint256 tokenId, uint256 quantity) public onlyNftManager {
      _mint(to, tokenId, quantity, "");
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

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC1155, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // This generates the metadata on-chain for each NFT so metadata files do not need to be hosted
    // and unlimited number of NFTs can be minted
    function uri(uint256 tokenId) public view virtual override(ERC1155) returns (string memory) {
        require(exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

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
}
