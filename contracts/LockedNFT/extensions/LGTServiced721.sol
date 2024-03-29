// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "contracts/Roles/LGTAccessControl.sol";
import "../Locked721.sol";

contract LGTServiced721 is LGTAccessControl, Locked721 {
    using Strings for uint256;

    // service status of this Phygital NFT collection
    // controls whether claiming functionality is still enabled
    // and whether transferred NFTs still lock and are unlockable by LGT
    // can also be used to determine whether exclusive digital content is still active
    bool private isServiceActive = true;

    constructor(string memory name_, string memory symbol_) Locked721(name_, symbol_) {
      _setupRole(NFT_MANAGER_ROLE, msg.sender);
      _setupRole(SERVICE_STATUS_ROLE, msg.sender);
      _setupRole(TOKEN_RECOVERY_ROLE, msg.sender);

      // set default admin as the manager of claim and unlock delegate roles
      _setRoleAdmin(NFT_MANAGER_ROLE, DEFAULT_ADMIN_ROLE);
      _setRoleAdmin(SERVICE_STATUS_ROLE, DEFAULT_ADMIN_ROLE);
      // @IMPORTANT: Comment out the line below if token recovery is not needed
      _setRoleAdmin(TOKEN_RECOVERY_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function setIsServiceActive(bool isServiceActive_) external onlyServiceStatusManager {
        isServiceActive = isServiceActive_;
    }

    function getIsServiceActive() external view returns (bool) {
        return isServiceActive;
    }

    function _getTokenLock(uint256 tokenId) internal view override returns (bool) {
      // if Legitimate is no longer servicing this collection, all NFTs become unlocked
      return isServiceActive && super._getTokenLock(tokenId);
    }

    // MINTING FUNCTIONS
    function mint(uint256 tokenId) external onlyNftManager {
      _safeMint(msg.sender, tokenId);
    }

    function mint(address to, uint256 startTokenId, uint256 quantity) external onlyNftManager {
      for (uint256 i = 0; i < quantity; i++) {
        _safeMint(to, startTokenId + i);
      }
    }

    // only prevent token transfers if the preventTransferWhenLocked flag is set to true
    // if the token is being recovered, also bypass the token transfer prevention
    function _shouldPreventTokenTransfer (address from, address to, uint256 startTokenId, uint256 batchSize) internal override view returns (bool) {
        return
        isServiceActive && // if service is not active, do not prevent token transfers
        bytes4(keccak256("recoverToken(uint256)")) != msg.sig && // this transfer is not a call to recoverToken
        super._shouldPreventTokenTransfer(from, to, startTokenId, batchSize);
    }

    // TOKEN RECOVERY FUNCTIONS
    // This allows the creator of physical items to process returns or exchanges
    // and recover the NFT so that it can be sent to the API delegate wallet and resold with the NFT.
    // The new owner can claim or activate again as if the item was brand new.
    // @IMPORTANT: Comment out the line below in if token recovery is not needed
    function recoverToken(uint256 tokenId) external onlyTokenRecoveryUser {
      _safeTransfer(ownerOf(tokenId), msg.sender, tokenId, "");
    }

    // The following functions are overrides required by Solidity for ERC-165
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(Locked721, AccessControl)
    returns (bool)
    {
      return super.supportsInterface(interfaceId);
    }
}
