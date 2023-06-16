# Legitimate LockedNFT Extensions

This directory contains contracts that are designed by the Legitimate team to
extend the functionality and real-world applicability of the LockedNFT protocol.
Although we recommend extending and using these contracts as they are, we
recognize that not every project will have the same role-based and service
requirements that Legitimate operates under. As such, we have provided these
contracts under the `/extensions` directory as an alternate option.

## LGTAccessControl

Adds additional roles to help manage NFT minting capabilities, recovery
capabilities, service term capabilities

## LGTNFTRoyalty

Adds support for ERC721Royalty

## LGTServiced721 and LGTServiced721Psi

These contracts are extensions of the Locked721 and Locked721Psi
contracts, respectively. These contracts add flags to toggle the service period
of LockedNFTs, as well as configurable options to enable/disable the soulbound
capabilities of LockedNFTs.
