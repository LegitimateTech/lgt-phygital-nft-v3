import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {Contract} from 'ethers';
import {ethers} from 'hardhat';
import {getDeployerAddress} from '../scripts/utils';

const ORIGIN_ADDRESS = '0x0000000000000000000000000000000000000000'
const SOULBOUND_ERROR = "Soulbound NFTs cannot be transferred"


describe('Legitimate1155NFTDistribution', () => {
  let contractAddress: string;
  let addr1: SignerWithAddress
  let lgtNFT: Contract;
  let deployerAddress: string;

  before(async () => {
    const LGTNFT = await ethers.getContractFactory("Legitimate1155NFTDistribution");
    lgtNFT = await LGTNFT.deploy();
    contractAddress = lgtNFT.address.toLowerCase()
    await lgtNFT.deployed();
    deployerAddress = await getDeployerAddress()
    const signers = await ethers.getSigners()
    addr1 = signers[1]
  })
  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = lgtNFT.address;
      expect(address).to.be.a('string');
    });
  })

  describe('minting', async () => {
    it('creates 2 new tokens', async () => {
      const tx = await lgtNFT['mint(address,uint256,uint256)'](deployerAddress, 1, 2);
      const txReceipt = await tx.wait()
      const collectionSupply = await lgtNFT['totalSupply()']();
      const exists = await lgtNFT.exists(1);
      const totalSupply = await lgtNFT['totalSupply(uint256)'](1);

      //SUCCESS
      expect(collectionSupply.toNumber()).to.eq(2)
      expect(exists).to.eq(true)
      expect(totalSupply.toNumber()).to.eq(2)

      const event = txReceipt.events[0].args
      expect(event.id.toString()).to.eq('1', 'id is correct')
      expect(event.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
      expect(event.to).to.eq(deployerAddress, 'to is correct')
      expect(event.value).to.eq(2, 'quantity is correct')

      let balance = await lgtNFT.balanceOf(deployerAddress, 1)
      expect(balance.toString()).to.eq('2')
    });
  })
  //
  describe('transferring', async () => {
    it('transfer a token from one address to another', async () => {
      const receivingAddress = addr1.address
      await lgtNFT.setIsSoulbound(false)
      const tx = await lgtNFT.safeTransferFrom(deployerAddress, receivingAddress, 1, 1, '0x');
      const txReceipt = await tx.wait()

      //SUCCESS
      const event = txReceipt.events[0].args;
      expect(event.id.toString()).to.eq('1', 'id is correct');
      expect(event.from).to.eq(deployerAddress, 'from is correct');
      expect(event.to).to.eq(receivingAddress, 'to is correct')
      expect(event.value).to.eq(1, 'quantity is correct')

      let deployerBalance = await lgtNFT.balanceOf(deployerAddress, 1)
      expect(deployerBalance.toString()).to.eq('1')

      let addr1Balance = await lgtNFT.balanceOf(addr1.address, 1)
      expect(addr1Balance.toString()).to.eq('1')
    });
  });
  describe('read token uri', async () => {
    it('returns new base64 encoded metadata uri', async () => {
      const result = await lgtNFT.uri(1);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`data:application/json;base64,eyjuyw1lijogikxhvcbfegftcgxlie5gvcajmsisimrlc2nyaxb0aw9uijogilroaxmgaxmgyw4gzxhhbxbszsborlqilcjpbwfnzsi6icjodhrwczovl2lwznmubgvnaxrpbwf0zs50zwnol2lwznmvuw1aeehpoddxu0fcqumyu2g0sfdja1znvhdyclc0r3vwsey3zjzmbnnzrzvhvsisimfuaw1hdglvbl91cmwioiaiin0=`);
    });
  });
  describe('soulbound', async () => {
    it('does not transfer when soulbound', async () => {
      const receivingAddress = addr1.address
      await lgtNFT.setIsSoulbound(true)

      // throws error
      await expect(lgtNFT.safeTransferFrom(deployerAddress, receivingAddress, 1, 1, '0x')).to.be.revertedWith(SOULBOUND_ERROR);
    })
  })
})
