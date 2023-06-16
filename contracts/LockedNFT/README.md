# Locked NFT

Locked721 and Locked721Psi are two separate implementations of the LockedNFT
protocol.

They both derive from a base class: Locked721Base

## Locked721Base

Locked721Base contains all of the state code and helper functions to manage
locked state. However, this contract does not specify a 721 implementation.

## Locked721

Locked721 is inherited from Locked721Base and OpenZeppelin's 721 implementation.

## Locked721Psi

Locked721 is inherited from Locked721Base and the 721Psi implementation.
