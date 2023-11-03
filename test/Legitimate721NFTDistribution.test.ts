import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai'
import {Contract} from 'ethers';
import {ethers} from 'hardhat'
import {getDeployerAddress} from '../scripts/utils'

const ORIGIN_ADDRESS = '0x0000000000000000000000000000000000000000'
const SOULBOUND_ERROR = "Soulbound NFTs cannot be transferred"


describe('Legitimate721NFTDistribution', () => {
  let contractAddress: string;
  let addr1: SignerWithAddress
  let lgtNFT: Contract;
  let deployerAddress: string;

  before(async () => {
    const LGTNFT = await ethers.getContractFactory("Legitimate721NFTDistribution");
    lgtNFT = await LGTNFT.deploy('LGT721NFTDistributionExample', 'LGT721Distribution');
    contractAddress = lgtNFT.address.toLowerCase()
    await lgtNFT.deployed();
    await lgtNFT.setNftTitle('LGT Example NFT');
    await lgtNFT.setNftDescription('This is an example NFT');
    await lgtNFT.setNftImageUri('https://ipfs.legitimate.tech/ipfs/QmZxHi87WSABAC2Sh4HWckVgTwXrW4GuVHF7f6LnssG5GU')
    deployerAddress = await getDeployerAddress()
    const signers = await ethers.getSigners()
    addr1 = signers[1]
  })
  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = lgtNFT.address;
      expect(address).to.be.a('string');
    });

    it('has a name', async () => {
      const name = await lgtNFT.name();
      expect(name).to.eq('LGT721NFTDistributionExample')
    });

    it('has a symbol', async () => {
      const symbol = await lgtNFT.symbol();
      expect(symbol).to.eq('LGT721Distribution')
    });
  })

  describe('minting', async () => {
    it('creates 2 new tokens', async () => {
      const tx = await lgtNFT['mint(address,uint256)'](deployerAddress, 2);
      const txReceipt = await tx.wait()
      const totalSupply = await lgtNFT.totalSupply();

      //SUCCESS
      expect(totalSupply.toNumber()).to.eq(2)

      const event = txReceipt.events[0].args
      expect(event.tokenId.toString()).to.eq('0', 'id is correct')
      expect(event.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
      expect(event.to).to.eq(deployerAddress, 'to is correct')

      let owner = await lgtNFT.ownerOf(1)
      expect(owner).to.eq(deployerAddress)
    });
  })
  describe('soulbound', async () => {
    it('does not transfer when soulbound', async () => {
      const receivingAddress = addr1.address
      await lgtNFT.setIsSoulbound(true)

      // throws error
      await expect(lgtNFT.transferFrom(deployerAddress, receivingAddress, 1)).to.be.revertedWith(SOULBOUND_ERROR);
    })
  })
  describe('transferring', async () => {
    it('transfer a token from one address to another', async () => {
      const receivingAddress = addr1.address
      await lgtNFT.setIsSoulbound(false)
      const tx = await lgtNFT.transferFrom(deployerAddress, receivingAddress, 0);
      const txReceipt = await tx.wait()

      //SUCCESS
      const event = txReceipt.events[1].args;
      expect(event.tokenId.toString()).to.eq('0', 'id is correct');
      expect(event.from).to.eq(deployerAddress, 'from is correct');
      expect(event.to).to.eq(receivingAddress, 'to is correct')
      const owner = await lgtNFT.ownerOf(0);
      expect(owner, receivingAddress);
    });
  });
  describe('read token uri', async () => {
    it('returns new base64 encoded metadata uri', async () => {
      const result = await lgtNFT.tokenURI(0);
      const result2 = await lgtNFT.tokenURI(1);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`data:application/json;base64,eyjuyw1lijogikxhvcbfegftcgxlie5gvcajmcisimrlc2nyaxb0aw9uijogilroaxmgaxmgyw4gzxhhbxbszsborlqilcjpbwfnzsi6icjodhrwczovl2lwznmubgvnaxrpbwf0zs50zwnol2lwznmvuw1aeehpoddxu0fcqumyu2g0sfdja1znvhdyclc0r3vwsey3zjzmbnnzrzvhvsisimfuaw1hdglvbl91cmwioiaiin0=`);
      expect(result2.toLowerCase()).to.eq(`data:application/json;base64,eyjuyw1lijogikxhvcbfegftcgxlie5gvcajmsisimrlc2nyaxb0aw9uijogilroaxmgaxmgyw4gzxhhbxbszsborlqilcjpbwfnzsi6icjodhrwczovl2lwznmubgvnaxrpbwf0zs50zwnol2lwznmvuw1aeehpoddxu0fcqumyu2g0sfdja1znvhdyclc0r3vwsey3zjzmbnnzrzvhvsisimfuaw1hdglvbl91cmwioiaiin0=`);
      expect(result.toLowerCase()).to.not.eq(result2.toLowerCase())
    });
    it('returns same metadata when numbered option is off', async () => {
      await lgtNFT.setIsNumbered(false)
      const result = await lgtNFT.tokenURI(0);
      const result2 = await lgtNFT.tokenURI(1);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(result2.toLowerCase())
    });
  });

})
