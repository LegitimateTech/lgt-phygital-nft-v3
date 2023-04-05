# LGT Phygital NFT v3
This repo is for the open source NFT contract that powers the Legitimate Phygital Protocol.

In order for your project to work with Legitimate's hosted services, you must deploy our contract or integrate certain functions and permissions into your own NFT contract.

More documentation and libraries will be coming soon. As we build out our protocol, test, and verify our solutions, we will gradually open source additional parts of our on-chain and off-chain solutions.

## Setup
Create a new file with environment variables for API services such as Etherscan

`cp .env.sample .env` and add the proper API keys

## Test

Run a local blockchain node through Hardhat and then run the Hardhat tests.
Both must be run simultaneously.

1. `npm run run:local`
2. `npm run test`

## Deploy

The list of supported networks is configurable via `hardhat.config.ts`.

`npx hardhat run --network goerli scripts/deployLegitimateNFTv3.ts`

## Verify on Etherscan

`npx hardhat run --network goerli scripts/verifyEtherscan.ts`

## Deployed Contracts
All contract addresses are stored in the `/networks` directory

## Use with Ethereum Remix IDE

This NFT contract can be edited, compiled, deployed, and verified via Ethereum Foundation's [Remix IDE](https://remix.ethereum.org/).

* Copy and paste the NFT contract `.sol` file into Remix or import this repository via git.
* Make sure to turn on optimizations when compiling and deploying to save on gas fees.
* To verify the contract on blockchain scanners such as Etherscan or Polygonscan manually, flatten the contract file and copy the contents of the flattened file to the verification page on the blockchain scanner as a single file contract. There is also an Etherscan plugin for Remix that works for Ethereum mainnet only.
