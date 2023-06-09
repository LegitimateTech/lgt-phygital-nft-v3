import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai'
import {Contract} from 'ethers';
import {ethers} from 'hardhat'
import {getDeployerAddress} from '../scripts/utils'
import {keccak256} from '@ethersproject/keccak256';
import {toUtf8Bytes} from "@ethersproject/strings";

const ORIGIN_ADDRESS = '0x0000000000000000000000000000000000000000'
const OWNABLE_CALLER_IS_NOT_API_DELEGATE = 'Caller does not have permission to perform claim or unlock'
const OWNABLE_CALLER_IS_NOT_NFT_MANAGER = 'Caller does not have permission to manage NFTs'
const OWNABLE_CALLER_IS_NOT_RECOVERY = 'Caller does not have permission to recover NFTs'
const OWNABLE_CALLER_IS_NOT_STATUS_MANAGER = 'Caller does not have permission to set the service status of this contract'
const TOKEN_NOT_UNLOCKED = 'Please unlock your NFT by tapping the LGT Tag before transferring.'
const NONEXISTANT_TOKEN = 'ERC721: owner query for nonexistent token'


describe('LegitimatePhygitalNFTv3', () => {
  let contractAddress: string;
  let addr1: SignerWithAddress
  let lgtNFT: Contract;
  let deployerAddress: string;
  const tokenId1 = '1234'
  const tokenId2 = '12345'
  const tokenId3 = '123456'

  before(async () => {
    const LGTNFT = await ethers.getContractFactory("LegitimatePhygitalNFTv3");
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

    it('has a name', async () => {
      const name = await lgtNFT.name();
      expect(name).to.eq('LGTPhygitalNFTv3Example')
    });

    it('has a symbol', async () => {
      const symbol = await lgtNFT.symbol();
      expect(symbol).to.eq('LGTNFTv3Example')
    });
  })

  describe('minting', async () => {
    it('creates a new token with tokenId', async () => {
      const tx = await lgtNFT['mint(uint256)'](tokenId1);
      const txReceipt = await tx.wait()
      const totalSupply = await lgtNFT.totalSupply();

      //SUCCESS
      expect(totalSupply.toNumber()).to.eq(1)

      const event = txReceipt.events[0].args
      expect(event.tokenId.toString()).to.eq(tokenId1, 'id is correct')
      expect(event.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
      expect(event.to).to.eq(deployerAddress, 'to is correct')

      let owner = await lgtNFT.ownerOf(tokenId1)
      expect(owner).to.eq(deployerAddress)
    });
    it('creates a new token with tokenId and initialOwner when transfer locked', async () => {
      const initialOwner = await addr1.getAddress()
      await lgtNFT.setTransferLock(true)
      const tx = await lgtNFT['mint(uint256,address)'](tokenId2, initialOwner);
      const txReceipt = await tx.wait()
      const totalSupply = await lgtNFT.totalSupply();
      await lgtNFT.setTransferLock(false)

      //SUCCESS
      expect(totalSupply.toNumber()).to.eq(2)

      const event = txReceipt.events[0].args
      expect(event.tokenId.toString()).to.eq(tokenId2, 'id is correct')
      expect(event.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
      expect(event.to).to.eq(initialOwner, 'to is correct')

      let owner = await lgtNFT.ownerOf(tokenId2)
      expect(owner).to.eq(initialOwner)
    });
    it('creates a new token with tokenId, initialOwner, and royalty information', async () => {
      const initialOwner = '0x0000000000000000000000000000000000000001'
      const feeReceiver = '0x0000000000000000000000000000000000000002'
      const feeNumerator = 1000
      const tx = await lgtNFT['mint(uint256,address,address,uint96)'](tokenId3, initialOwner, feeReceiver, feeNumerator);
      const txReceipt = await tx.wait()
      const totalSupply = await lgtNFT.totalSupply();

      //SUCCESS
      expect(totalSupply.toNumber()).to.eq(3)

      const event = txReceipt.events[0].args
      expect(event.tokenId.toString()).to.eq(tokenId3, 'id is correct')
      expect(event.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
      expect(event.to).to.eq(initialOwner, 'to is correct')

      const salePrice = 1000000
      let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId3, salePrice)
      expect(royaltyAddress).to.eq(feeReceiver)
      expect(royaltyFee).to.eq(salePrice * feeNumerator / 10000)
    });
    it('batch mints NFTs', async () => {
      await lgtNFT.batchMint(1, 3, deployerAddress, true)

      const totalSupply = await lgtNFT.totalSupply();
      expect(totalSupply.toNumber()).to.eq(6)
      const tokenLock1 = await lgtNFT.getTokenLock(1)
      expect(tokenLock1).to.eq(true)
      const tokenLock2 = await lgtNFT.getTokenLock(2)
      expect(tokenLock2).to.eq(true)
      const tokenLock3 = await lgtNFT.getTokenLock(3)
      expect(tokenLock3).to.eq(true)
      const owner = await lgtNFT.ownerOf(1);
      expect(owner, deployerAddress);
    })
    it('batch mints unlocked NFTs to different address', async () => {
      await lgtNFT.batchMint(4, 5, await addr1.getAddress(), false)

      const totalSupply = await lgtNFT.totalSupply();
      expect(totalSupply.toNumber()).to.eq(8)
      const tokenLock4 = await lgtNFT.getTokenLock(4)
      expect(tokenLock4).to.eq(false)
      const tokenLock5 = await lgtNFT.getTokenLock(5)
      expect(tokenLock5).to.eq(false)
      const owner = await lgtNFT.ownerOf(4);
      expect(owner, await addr1.getAddress());
    })
  })
  //
  describe('transferring', async () => {
    it('transfer a token from one address to another', async () => {
      const receivingAddress = addr1.address
      const tx = await lgtNFT.transferFrom(deployerAddress, receivingAddress, tokenId1);
      const txReceipt = await tx.wait()

      //SUCCESS
      const event = txReceipt.events[1].args;
      expect(event.tokenId.toString()).to.eq(tokenId1, 'id is correct');
      expect(event.from).to.eq(deployerAddress, 'from is correct');
      expect(event.to).to.eq(receivingAddress, 'to is correct')
      const owner = await lgtNFT.ownerOf(tokenId1);
      expect(owner, receivingAddress);
    });
  });
  //
  describe('transferring token with lock states', async () => {
    it('transfer a token from one address to another', async () => {
      const receivingAddress = '0x0000000000000000000000000000000000000006'
      await lgtNFT.setTransferLock(true)
      // address without API_DELEGATE permission should not be able to transfer locked NFT when transfer lock is set
      await expect(lgtNFT.connect(addr1).transferFrom(addr1.address, receivingAddress, tokenId1)).to.be.revertedWith(TOKEN_NOT_UNLOCKED);

      await lgtNFT.setTokenLock(tokenId1, false)
      const tx = await lgtNFT.connect(addr1).transferFrom(addr1.address, receivingAddress, tokenId1);
      const txReceipt = await tx.wait()

      //SUCCESS
      const event = txReceipt.events[1].args;
      expect(event.tokenId.toString()).to.eq(tokenId1, 'id is correct');
      expect(event.from).to.eq(addr1.address, 'from is correct');
      expect(event.to).to.eq(receivingAddress, 'to is correct')
      const owner = await lgtNFT.ownerOf(tokenId1);
      expect(owner, receivingAddress);
      // reset transfer lock
      await lgtNFT.setTransferLock(false)
    });
  });
  //
  describe('read token uri', async () => {
    it('sets new base uri and returns new metadata uri', async () => {
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/locked`);
      expect(result2.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/locked`);
    });
  });
  //
  describe('set base uri', async () => {
    it('sets new base uri and returns new metadata uri', async () => {
      await lgtNFT.setBaseURI("https://somethingelse.com")
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://somethingelse.com/locked`);
      expect(result2.toLowerCase()).to.eq(`https://somethingelse.com/locked`);
    });
  });

  describe('token locks', () => {
    describe('setTokenLock', async () => {
      it('allows owner to set token lock', async () => {
        let tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(true)

        await lgtNFT.setTokenLock(tokenId1, false)

        const tokenUri = await lgtNFT.tokenURI(tokenId1)
        expect(tokenUri.toLowerCase()).to.eq(`https://somethingelse.com/${tokenId1}`)
        tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(false)
      })
      it('does not allow non-owner to set token lock', async () => {
        await expect(lgtNFT.connect(addr1).setTokenLock(tokenId1, false)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
      })
    })
    describe('_afterTokenTransfer', async () => {
      it('automatically locks a token', async () => {
        let tokenLock = await lgtNFT.getTokenLock(tokenId2)
        expect(tokenLock).to.eq(true)

        const receivingAddress = '0x0000000000000000000000000000000000000006'
        await lgtNFT.connect(addr1).transferFrom(await addr1.getAddress(), receivingAddress, tokenId2);

        const tokenUri = await lgtNFT.tokenURI(tokenId2)
        expect(tokenUri.toLowerCase()).to.eq(`https://somethingelse.com/locked`)
        tokenLock = await lgtNFT.getTokenLock(tokenId2)
        expect(tokenLock).to.eq(true)
      })
    })
  })

  describe('royalties', () => {
    describe('setDefaultRoyalty', () => {
      const receiver = '0x0000000000000000000000000000000000000006'
      const feeNumerator = 1000
      it('allows owner to set default Royalty', async () => {
        await lgtNFT.setDefaultRoyalty(receiver, feeNumerator)
      })
      it('expects the default royalty to be set for all sales', async () => {
        const salePrice = 1000000
        let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId1, salePrice)
        expect(royaltyAddress).to.eq(receiver)
        expect(royaltyFee).to.eq(salePrice * feeNumerator / 10000)
      })
      it('does not allow non-owner to set default royalty', async () => {
        await expect(lgtNFT.connect(addr1).setDefaultRoyalty(receiver, feeNumerator)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })

    describe('deleteDefaultRoyalty', () => {
      it('allows owner to delete default Royalty', async () => {
        await lgtNFT.deleteDefaultRoyalty()
      })
      it('expects the default royalty to be set for all sales', async () => {
        const salePrice = 1000000
        let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId1, salePrice)
        expect(royaltyAddress).to.eq(ORIGIN_ADDRESS)
        expect(royaltyFee).to.eq(0)
      })
      it('does not allow non-owner to delete default royalty', async () => {
        await expect(lgtNFT.connect(addr1).deleteDefaultRoyalty()).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })

    describe('setTokenRoyalty', () => {
      const receiver = '0x0000000000000000000000000000000000000006'
      const feeNumerator = 1000
      before(async () => {
        await lgtNFT.deleteDefaultRoyalty()
        await lgtNFT.resetTokenRoyalty(tokenId1)
        await lgtNFT.resetTokenRoyalty(tokenId2)
        await lgtNFT.resetTokenRoyalty(tokenId3)
      })
      it('allows owner to set token Royalty', async () => {
        await lgtNFT.setTokenRoyalty(tokenId1, receiver, feeNumerator)
      })
      it('expects the royalty to be set for that specific tokenId', async () => {
        const salePrice = 1000000
        let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId1, salePrice)
        expect(royaltyAddress).to.eq(receiver)
        expect(royaltyFee).to.eq(salePrice * feeNumerator / 10000)
      })
      it('expects no royalty to be set for other tokens', async () => {
        const salePrice = 1000000
        let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId2, salePrice)
        expect(royaltyAddress).to.eq(ORIGIN_ADDRESS)
        expect(royaltyFee).to.eq(0)
      })
      it('does not allow non-owner to set token royalty', async () => {
        await expect(lgtNFT.connect(addr1).setTokenRoyalty(tokenId1, receiver, feeNumerator)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })
    describe('resetTokenRoyalty', () => {
      it('allows owner to reset token royalty', async () => {
        await lgtNFT.resetTokenRoyalty(tokenId1)
      })
      it('expects the royalty to be set for that specific tokenId', async () => {
        const salePrice = 1000000
        let [royaltyAddress, royaltyFee] = await lgtNFT.royaltyInfo(tokenId1, salePrice)
        expect(royaltyAddress).to.eq(ORIGIN_ADDRESS)
        expect(royaltyFee).to.eq(0)
      })
      it('does not allow non-owner to reset token royalty', async () => {
        await expect(lgtNFT.connect(addr1).resetTokenRoyalty(tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })
    describe('setServiceStatus', () => {
      it('allows owner to set service status', async () => {
        await lgtNFT.setServiceStatus(true)
      })
      it('turns off token lock when status is off', async () => {
        await lgtNFT.setTokenLock(tokenId1, true)
        let tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(true)
        await lgtNFT.setServiceStatus(false)
        tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(false)
        let serviceStatus = await lgtNFT.getServiceStatus()
        expect(serviceStatus).to.eq(false)
        await lgtNFT.setServiceStatus(true)
        serviceStatus = await lgtNFT.getServiceStatus()
        expect(serviceStatus).to.eq(true)
      })
      it('does not allow non-owner to set service status', async () => {
        await expect(lgtNFT.connect(addr1).setServiceStatus(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
      })
    })
    describe('grantRole and revokeRole', () => {
      it('allows admin to grant and revoke API delegate role', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), await addr1.getAddress())
        await lgtNFT.connect(addr1).setTokenLock(tokenId1, false)
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), await addr1.getAddress())
        await expect(lgtNFT.connect(addr1).setTokenLock(tokenId1, false)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
      })
      it('allows admin to grant and revoke NFT manager role', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), await addr1.getAddress())
        await lgtNFT.connect(addr1).resetTokenRoyalty(tokenId1)
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), await addr1.getAddress())
        await expect(lgtNFT.connect(addr1).resetTokenRoyalty(tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
      it('allows admin to grant and revoke recovery role', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), await addr1.getAddress())
        await lgtNFT.connect(addr1).recoverToken(tokenId1)
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), await addr1.getAddress())
        await expect(lgtNFT.connect(addr1).recoverToken(tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_RECOVERY)
      })
      it('allows admin to grant and revoke service manager role', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), await addr1.getAddress())
        await lgtNFT.connect(addr1).setServiceStatus(false)
        await lgtNFT.connect(addr1).setServiceStatus(true)
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), await addr1.getAddress())
        await expect(lgtNFT.connect(addr1).setServiceStatus(tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
      })
    })
    describe('recoverToken', () => {
      it('admin recovers token from another address', async () => {
        let owner = await lgtNFT.ownerOf(tokenId1)
        expect(owner).to.not.eq(deployerAddress)

        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), await deployerAddress)
        await lgtNFT.recoverToken(tokenId1)
        owner = await lgtNFT.ownerOf(tokenId1)
        expect(owner).to.eq(deployerAddress)
      })
    })
    describe('recoverToken should work with transfer lock on', () => {
      it('admin recovers token from another address', async () => {
        let owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.not.eq(deployerAddress)

        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), await addr1.getAddress())

        // token lock on
        await lgtNFT.setTransferLock(true)
        await lgtNFT.connect(addr1).recoverToken(tokenId2)
        owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.eq(addr1.address)
        await lgtNFT.setTransferLock(false)

        // token lock off
        await lgtNFT.recoverToken(tokenId2)
        owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.eq(deployerAddress)
      })
    })
    describe('claim', () => {
      it('API wallet can perform claim function and send NFT to Tap end consumer', async () => {
        const receiver = '0x0000000000000000000000000000000000000006'
        await lgtNFT.claim(receiver, tokenId1)

        const owner = await lgtNFT.ownerOf(tokenId1)
        expect(owner).to.eq(receiver)
        const tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(false)
      })
    })
    describe('claim with transfer lock on', () => {
      it('API wallet can perform claim function and send NFT to Tap end consumer', async () => {
        await lgtNFT.setTransferLock(true)
        const receiver = addr1.address
        await lgtNFT.claim(receiver, tokenId2)

        const owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.eq(receiver)
        const tokenLock = await lgtNFT.getTokenLock(tokenId2)
        expect(tokenLock).to.eq(false)
        await lgtNFT.setTransferLock(false)
      })
    })
    describe('burn', () => {
      it('owner can burn token', async () => {
        const burnAddr = '0x0000000000000000000000000000000000000000'
        let balance = await lgtNFT.balanceOf(addr1.address)
        expect(balance).to.eq(3)
        await lgtNFT.connect(addr1).burn(tokenId2)

        balance = await lgtNFT.balanceOf(addr1.address)
        expect(balance).to.eq(2)
      })
    })
  })
})
