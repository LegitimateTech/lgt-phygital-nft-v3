import fs from 'fs'
import { ethers} from 'hardhat'

const NETWORK_MAP: any = {
  "1": "mainnet",
  "4": "rinkeby",
  "5": "goerli",
  "137": "polygon",
  "80001": "polygonMumbai",
  "43113": "avalancheFujiTestnet",
  "43114": "avalanche",
  "1337": "local",
  "31337": "local",
}

export async function getNetworkName() {
  console.log(`Getting network name... ${JSON.stringify(ethers.provider)}`)
  const chainId = (await ethers.provider.getNetwork()).chainId;
  return NETWORK_MAP[chainId];
}

export async function getAddressBook() {
  const networkName: string = await getNetworkName()
  return JSON.parse(fs.readFileSync(`networks/${networkName}.json`).toString())
}

export async function getDeployerAddress() {
  return ethers.provider.getSigner().getAddress()
}
