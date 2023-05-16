// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract LegitimatePhygitalNFTv3 is ERC721Royalty, ERC721Enumerable, AccessControl {
    using Strings for uint256;

    // ROLES
    // role for server API to allow users to claim and unlock NFTs
    bytes32 public constant API_DELEGATE_ROLE = keccak256("API_DELEGATE_USER");
    // role for partners to mint NFTs, manage metadata, set royalties, and manage whitelisted marketplaces
    bytes32 public constant NFT_MANAGER_ROLE = keccak256("NFT_MANAGER_USER");
    // role for managing service status of the contract
    bytes32 public constant SERVICE_STATUS_ROLE = keccak256("SERVICE_STATUS_MANAGER_USER");
    // role for recovery of NFTs if physical item is returned
    // @IMPORTANT: Comment out the line below if token recovery is not needed
    bytes32 public constant TOKEN_RECOVERY_ROLE = keccak256("TOKEN_RECOVERY_USER");

    // stores the locked state for each NFT
    mapping(uint256 => bool) tokenLock;

    // METADATA
    string public baseURI = "https://metadata.legitimate.tech/example";

    // service status of this Phygital NFT collection
    // controls whether claiming functionality is still enabled
    // and whether transferred NFTs still lock and are unlockable by LGT
    // can also be used to determine whether exclusive digital content is still active
    bool public isServiceActive = true;

    // this governs the transfer lock functionality
    // when the token is in a locked state after the transfer, the token cannot be transferred again
    // until it has been unlocked by tapping the LGT tag and submitting the chip's signature to the API
    // this effectively turns the NFT into a semi soul bound NFT and prevents the NFT from being traded
    // without transferring the physical item to the new owner as well
    bool public preventTransferWhenLocked = false;

    constructor() ERC721("LGTPhygitalNFTv3Example", "LGTNFTv3Example") {
      // contract deployer is the admin by default
      _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
      // contract deployer can be granted some initial roles to start with
      _setupRole(API_DELEGATE_ROLE, msg.sender);
      _setupRole(NFT_MANAGER_ROLE, msg.sender);
      _setupRole(SERVICE_STATUS_ROLE, msg.sender);

      // set default admin as the manager of claim and unlock delegate roles
      _setRoleAdmin(API_DELEGATE_ROLE, DEFAULT_ADMIN_ROLE);
      _setRoleAdmin(NFT_MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
      _setRoleAdmin(SERVICE_STATUS_ROLE, DEFAULT_ADMIN_ROLE);
      // @IMPORTANT: Comment out the line below if token recovery is not needed
      _setRoleAdmin(TOKEN_RECOVERY_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newURI) public onlyNftManager {
        baseURI = newURI;
    }

    function setTransferLock(bool lock) public onlyNftManager {
      preventTransferWhenLocked = lock;
    }

    function setServiceStatus(bool status) public onlyServiceStatusManager {
        isServiceActive = status;
    }

    function getServiceStatus() public view returns (bool) {
        return isServiceActive;
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

    // ACCESS CONTROL
    modifier onlyAdmin() {
      require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not an admin");
      _;
    }

    modifier onlyApiDelegate() {
      require(hasRole(API_DELEGATE_ROLE, msg.sender), "Caller does not have permission to perform claim or unlock");
      _;
    }

    modifier onlyNftManager() {
      require(hasRole(NFT_MANAGER_ROLE, msg.sender), "Caller does not have permission to manage NFTs");
      _;
    }

    modifier onlyServiceStatusManager() {
      require(hasRole(SERVICE_STATUS_ROLE, msg.sender), "Caller does not have permission to set the service status of this contract");
      _;
    }

    // @IMPORTANT: Comment out the line below if token recovery is not needed
    modifier onlyTokenRecoveryUser() {
      require(hasRole(TOKEN_RECOVERY_ROLE, msg.sender), "Caller does not have permission to recover NFTs");
      _;
    }

    // TOKENLOCK FUNCTIONS
    function _setTokenLock(uint256 tokenId, bool locked) internal {
      tokenLock[tokenId] = locked;
    }

    function setTokenLock(uint256 tokenId, bool locked) public onlyApiDelegate {
      _setTokenLock(tokenId, locked);
    }

    // READ TOKENLOCK STATE FUNCTIONS
    function _getTokenLock(uint256 tokenId) internal view returns (bool) {
      // if Legitimate is no longer servicing this collection, all NFTs become unlocked
      if (isServiceActive == false) {
        return false;
      }

      return tokenLock[tokenId];
    }

    function getTokenLock(uint256 tokenId) public view returns (bool) {
      return _getTokenLock(tokenId);
    }

    // MINTING FUNCTIONS
    function mint(uint256 tokenId) public onlyNftManager {
      _safeMint(msg.sender, tokenId);
    }

    function mint(uint256 tokenId, address to) public onlyNftManager {
      _safeMint(to, tokenId);
    }

    function mint(uint256 tokenId, address to, address feeReceiver, uint96 feeNumerator) public onlyNftManager{
      _safeMint(to, tokenId);
      _setTokenRoyalty(tokenId, feeReceiver, feeNumerator);
    }

    function batchMint(uint256 startTokenId, uint256 endTokenId, address to, bool locked) public onlyNftManager {
      for (uint256 i = startTokenId; i <= endTokenId; i++) {
        _safeMint(to, i);
      }

      // @todo: there's probably a more gas efficient way to do this, but this is fine for now
      if (locked == false) {
        for (uint256 i = startTokenId; i <= endTokenId; i++) {
          _setTokenLock(i, false);
        }
      }
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

    // TOKEN RECOVERY FUNCTIONS
    // This allows the creator of physical items to process returns or exchanges
    // and recover the NFT so that it can be sent to the API delegate wallet and resold with the NFT.
    // The new owner can claim or activate again as if the item was brand new.
    // @IMPORTANT: Comment out the line below in if token recovery is not needed
    function recoverToken(uint256 tokenId) public onlyTokenRecoveryUser {
      _safeTransfer(ownerOf(tokenId), msg.sender, tokenId, "");
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
    internal
    override(ERC721, ERC721Enumerable)
    {
      if (preventTransferWhenLocked == true &&
        from != address(0) && // is not minting token
        !(from == msg.sender && hasRole(API_DELEGATE_ROLE, msg.sender)) && // is not claiming token
        !(to == msg.sender && hasRole(TOKEN_RECOVERY_ROLE, msg.sender)) // is not recovering token
        ) {
        require(!_getTokenLock(tokenId), "Please unlock your NFT by tapping the LGT Tag before transferring.");
      }
      super._beforeTokenTransfer(from, to, tokenId);
    }

    // This locking mechanism disencentivizes people from separately selling the NFT without the physical item
    // in order to unlock. The owner of the NFT will need to unlock with the params generated by the LGT tag
    // and verified by LGT's servers. Since the unlock is done by LGT, the transaction is gasless for end users
    // and the gas is paid by Legitimate as part of the ongoing service contract.
    // Exclusive content and other experiences can also be gated behind this lock mechanism as well.
    function _afterTokenTransfer(address from, address to, uint256 tokenId) override(ERC721) internal {
      super._afterTokenTransfer(from, to, tokenId);
      _setTokenLock(tokenId, true);
    }

    // @todo: is not gas optimized since _afterTokenTransfer sets lock = true and then this sets lock = false
    // This is used for end users to claim NFTs minted to our delegate wallet and makes the claim activation gasless for end users
    // the delegate wallet performing the claim functionality needs to own the NFT
    // we check the ownership information on our API service used by Tap
    function claim(address to, uint256 tokenId) public onlyApiDelegate {
      require(_isApprovedOrOwner(msg.sender, tokenId));

      _transfer(msg.sender, to, tokenId);
      _setTokenLock(tokenId, false);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Enumerable, ERC721Royalty, AccessControl)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721Royalty) {
        super._burn(tokenId);
    }
}
