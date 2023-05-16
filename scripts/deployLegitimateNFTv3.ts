import fs from 'fs'
import { getNetworkName, getDeployerAddress } from './utils'
import {ethers} from 'hardhat'

const CONTRACT_NAME = "LegitimatePhygitalNFTv3"

async function main() {
  console.log(`Starting deployment script...`)
  const networkName = await getNetworkName()
  const deployerAddress = await getDeployerAddress()
  console.log(`Deploying to ${networkName}`);
  console.log(`Deployer address is to ${deployerAddress}`);
  console.log(`Network is ${networkName}`);

  console.log(`Deploying ${CONTRACT_NAME}`);
  const LegitimateLockedNFT = await ethers.getContractFactory(CONTRACT_NAME);
  // Start deployment, returning a promise that resolves to a contract object
  const legitimateLockedNFT = await LegitimateLockedNFT.deploy({
    gasPrice:  ethers.utils.parseUnits(`5`, 'gwei').toNumber(),
    gasLimit: ethers.BigNumber.from('4200000'),
  });

  console.log(`${CONTRACT_NAME} deployed to address:`, legitimateLockedNFT.address.toLowerCase());

  const info = {
    Contracts: {
      [CONTRACT_NAME]: legitimateLockedNFT.address.toLowerCase(),
    },
    DeployBlocks: {
      [CONTRACT_NAME]: legitimateLockedNFT.deployTransaction.blockNumber,
    }
  };

  // if (!isLocal) {
    fs.writeFileSync(
      `${__dirname}/../networks/${networkName}.json`,
      JSON.stringify(info, null, 2)
    );
  // }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
