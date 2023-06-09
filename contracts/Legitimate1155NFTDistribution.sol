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

    /**
     * @dev Total amount of tokens in the entire ERC1155 collection.
     */
    function collectionSupply() public view returns (uint256) {
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

    bool public isSoulbound = true; // NFTs cannot be transferred once they are claimed

    constructor() ERC1155("https://metadata.legitimate.tech/example/{id}") {
      // contract deployer is the admin by default
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      _setupRole(NFT_MANAGER_ROLE, msg.sender);
      _setRoleAdmin(NFT_MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function setURI(string memory newuri) public onlyNftManager {
        _setURI(newuri);
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
}
