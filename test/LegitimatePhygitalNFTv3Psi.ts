import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai'
import {BigNumber, Contract, ContractReceipt, ContractTransaction, Event} from 'ethers';
import {ethers} from 'hardhat'
import {getDeployerAddress} from '../scripts/utils'
import {keccak256} from '@ethersproject/keccak256';
import {toUtf8Bytes} from "@ethersproject/strings";

const ORIGIN_ADDRESS = '0x0000000000000000000000000000000000000000'
const OWNABLE_CALLER_IS_NOT_ADMIN = 'Caller is not an admin'
const OWNABLE_CALLER_IS_NOT_API_DELEGATE = 'Caller does not have permission to perform claim or unlock'
const OWNABLE_CALLER_IS_NOT_NFT_MANAGER = 'Caller does not have permission to manage NFTs'
const OWNABLE_CALLER_IS_NOT_RECOVERY = 'Caller does not have permission to recover NFTs'
const OWNABLE_CALLER_IS_NOT_STATUS_MANAGER = 'Caller does not have permission to set the service status of this contract'
const TOKEN_NOT_UNLOCKED = 'Please unlock your NFT by tapping the LGT Tag before transferring.'
const NONEXISTANT_TOKEN = 'ERC721: owner query for nonexistent token'

describe('LegitimatePhygitalNFTv3Psi', () => {
  let addr1: SignerWithAddress
  let addr2: SignerWithAddress
  let addrWithNoRoles: SignerWithAddress
  let lgtNFT: Contract;
  let deployerAddress: string;
  const tokenId1 = '0'
  const tokenId2 = '1'

  before(async () => {
    const LGTNFT = await ethers.getContractFactory("LegitimatePhygitalNFTv3Psi");
    lgtNFT = await LGTNFT.deploy();
    await lgtNFT.deployed();
    deployerAddress = await getDeployerAddress()
    const signers = await ethers.getSigners()
    addr1 = signers[1]
    addr2 = signers[2]
    addrWithNoRoles = signers[3]
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

  describe('configuration options', async () => {
    describe('baseURI', async () => {
      let originalBaseURI: string
      before(async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
        originalBaseURI = await lgtNFT.baseURI()
      })
      after(async () => {
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
        await lgtNFT.setBaseURI(originalBaseURI)
      })
      it('allows NFT_MANAGER_USER to call setBaseURI', async () => {
        expect(originalBaseURI).to.eq('https://metadata.legitimate.tech/example')
        await lgtNFT.connect(addr1).setBaseURI("https://newbaseuri.com")
      })
      it('does not allow non NFT_MANAGER_USER to call setBaseURI', async () => {
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
        await expect(lgtNFT.connect(addr1).setBaseURI(originalBaseURI)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })
    describe('shouldLockTokensAfterMint', async () => {
      it('allows admin to call setShouldLockTokensAfterMint', async () => {
        await lgtNFT.setShouldLockTokensAfterMint(false)
      })
      it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
        await expect(lgtNFT.connect(addr1).setShouldLockTokensAfterMint(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
        //reset
        await lgtNFT.setShouldLockTokensAfterMint(true)
      })
    })
    describe('shouldPreventTransferWhenLocked', async () => {
      it('allows admin to call setShouldPreventTransferWhenLocked', async () => {
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      })
      it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
        await expect(lgtNFT.connect(addr1).setShouldPreventTransferWhenLocked(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
        //reset
        await lgtNFT.setShouldPreventTransferWhenLocked(true)
      })
    })
    describe('isServiceActive', async () => {
      before(async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
      })
      after(async () => {
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
        await lgtNFT.setIsServiceActive(true)
      })
      it('allows SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
        await lgtNFT.connect(addr1).setIsServiceActive(false)
      })
      it('does not allow non SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
        await lgtNFT.revokeRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
        await expect(lgtNFT.connect(addr1).setIsServiceActive(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
      })
    })
  })

  describe('mint(), mint(address), mint(address,uint256)', async () => {
    it('user without NFT_MANAGER_USER role cannot mint', async () => {
      await expect(lgtNFT.connect(addrWithNoRoles)['mint()']()).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER);
      await expect(lgtNFT.connect(addrWithNoRoles)['mint(address)'](addr1.address)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER);
      await expect(lgtNFT.connect(addrWithNoRoles)['mint(address,uint256)'](addr1.address, 3)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER);
      const totalSupply = await lgtNFT.totalSupply()
      expect(totalSupply.toNumber()).to.eq(0)
    })
    describe('mint()', async () => {
      let tx: ContractTransaction;
      let txReceipt: ContractReceipt
      let startingSupply: BigNumber
      let expectedTokenId: string

      before(async () => {
        startingSupply = await lgtNFT.totalSupply()
        expectedTokenId = startingSupply.toString()
        tx = await lgtNFT['mint()']();
        txReceipt = await tx.wait()
      })

      //SUCCESS
      it('increments the total supply by 1', async () => {
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply).to.eq(startingSupply.add(1))
      })
      it('emits an event with the right args', async () => {
        const event = txReceipt.events?.find((ev) => {
          return ev.event == 'Transfer'
        })
        expect(event).to.exist
        if (event) {
          expect(event.args?.tokenId.toString()).to.eq(expectedTokenId, 'id is correct')
          expect(event.args?.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
          expect(event.args?.to).to.eq(deployerAddress, 'to is correct')
        }
      })
      it('the owner of the tokenID is correct', async () => {
        const owner = await lgtNFT.ownerOf(expectedTokenId)
        expect(owner).to.eq(deployerAddress)
      })
    });
    describe('mint(address)', async () => {
      let tx: ContractTransaction
      let txReceipt: ContractReceipt
      let startingSupply: BigNumber
      let expectedTokenId: string
      const mintToAddress = addr1.address

      before(async () => {
        await lgtNFT.setShouldPreventTransferWhenLocked(true)
        startingSupply = await lgtNFT.totalSupply();
        expectedTokenId = startingSupply.toString()
        tx = await lgtNFT['mint(address)'](mintToAddress);
        txReceipt = await tx.wait()
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      })

      //SUCCESS
      it('increments the total supply by 1', async () => {
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply).to.eq(startingSupply.add(1))
      })
      it('emits an event with the right args', async () => {
        const event = txReceipt.events?.find((ev) => {
          return ev.event == 'Transfer'
        })
        expect(event).to.exist
        if (event) {
          expect(event.args?.tokenId.toString()).to.eq(expectedTokenId, 'id is correct')
          expect(event.args?.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
          expect(event.args?.to).to.eq(mintToAddress, 'to is correct')
        }
      })
      it('the owner of the tokenID is correct', async () => {
        const owner = await lgtNFT.ownerOf(expectedTokenId)
        expect(owner).to.eq(mintToAddress)
      })
    })
    describe('mint(address,uint256) – batch minting', async () => {
      let tx: ContractTransaction
      let txReceipt: ContractReceipt
      let startingSupply: BigNumber
      let events: Event[]
      let mintToAddress: string
      const numberToMint = 3

      before(async () => {
        mintToAddress = deployerAddress
        await lgtNFT.setShouldPreventTransferWhenLocked(true)
        startingSupply = await lgtNFT.totalSupply();
        tx = await lgtNFT['mint(address,uint256)'](mintToAddress, numberToMint);
        txReceipt = await tx.wait()
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      })

      it('increments the total supply properly', async () => {
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply.toNumber()).to.eq(startingSupply.add(numberToMint).toNumber())
      })

      it('emits the right number of events', async () => {
        if (txReceipt?.events) {
          events = txReceipt?.events
        }
        expect(events.length).to.eq(numberToMint)
      })

      it('emits Transfer events with all the right args', async () => {
        txReceipt?.events?.forEach(async (ev, i) => {
          const {event, args} = ev
          expect(event).to.eq('Transfer')
          const expectedTokenId = startingSupply.add(i)
          expect(args?.tokenId).to.eq(expectedTokenId, 'id is correct')
          expect(args?.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
          expect(args?.to).to.eq(mintToAddress, 'to is correct')
          const tokenLock = await lgtNFT.getTokenLock(args?.tokenId)
          expect(tokenLock).to.eq(true)
          const owner = await lgtNFT.ownerOf(args?.tokenId)
          expect(owner, mintToAddress)
        })
      })
    })
    it('minting NFTs with flag shouldLockTokensAfterMint set to false', async () => {
      let tx: ContractTransaction
      let txReceipt: ContractReceipt
      let startingSupply: BigNumber
      let events: Event[]
      const mintToAddress = addr1.address
      const numberToMint = 3

      before(async () => {
        await lgtNFT.setShouldLockTokensAfterMint(false);
        startingSupply = await lgtNFT.totalSupply();
        tx = await lgtNFT['mint(address,uint256)'](mintToAddress, 3);
        txReceipt = await tx.wait()
      })
      after(async () => {
        // resets
        await lgtNFT.setShouldPreventTransferWhenLocked(true)
      })


      it('increments the total supply properly', async () => {
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply.toNumber()).to.eq(startingSupply.add(numberToMint).toNumber())
      })

      it('emits the right number of events', async () => {
        if (txReceipt?.events) {
          events = txReceipt?.events
        }
        expect(events.length).to.eq(numberToMint)
      })

      it('emits Transfer events with all the right args', async () => {
        txReceipt?.events?.forEach(async (ev, i) => {
          const {event, args} = ev
          expect(event).to.eq('Transfer')
          const expectedTokenId = startingSupply.add(i)
          expect(args?.tokenId).to.eq(expectedTokenId, 'id is correct')
          expect(args?.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
          expect(args?.to).to.eq(mintToAddress, 'to is correct')
          const tokenLock = await lgtNFT.getTokenLock(args?.tokenId)
          expect(tokenLock).to.eq(false)
          const owner = await lgtNFT.ownerOf(args?.tokenId)
          expect(owner, mintToAddress)
        })
      })
    })
  })
  //
  describe('transferring', async () => {
    describe('transferring', async () => {
      let tokenId: string

      before(async () => {
        const tx = await lgtNFT['mint()']();
        const txReceipt = await tx.wait()
        const event = txReceipt.events?.find((ev: Event) => {
          return ev.event == 'Transfer'
        })
        tokenId = event?.args?.tokenId
      })

      it('transfer a token from one address to another', async () => {
        const tx = await lgtNFT.transferFrom(deployerAddress, addr1.address, tokenId);
        const txReceipt = await tx.wait()

        //SUCCESS
        const event = txReceipt.events[1].args;
        expect(event.tokenId.toString()).to.eq(tokenId, 'id is correct');
        expect(event.from).to.eq(deployerAddress, 'from is correct');
        expect(event.to).to.eq(addr1.address, 'to is correct')
        const owner = await lgtNFT.ownerOf(tokenId);
        expect(owner, addr1.address);
      });
    })

    describe('if setShouldPreventTransferWhenLocked is true', async () => {
      let tokenId: string

      before(async () => {
        const tx = await lgtNFT['mint(address)'](addr1.address);
        const txReceipt = await tx.wait()
        const event = txReceipt.events?.find((ev: Event) => {
          return ev.event == 'Transfer'
        })
        tokenId = event?.args?.tokenId
        await lgtNFT.setShouldPreventTransferWhenLocked(true)
      })

      it('should revert if token is locked', async () => {
        // address without API_DELEGATE permission should not be able to transfer locked NFT when transfer lock is set
        await expect(lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId)).to.be.revertedWith(TOKEN_NOT_UNLOCKED);
      })
      it('should pass if token is unlocked, and lock the token after transfer', async () => {
        await lgtNFT.setTokenLock(tokenId, false)
        const tx = await lgtNFT.connect(addr1).transferFrom(addr1.address, deployerAddress, tokenId);
        await tx.wait()
        expect(await lgtNFT.getTokenLock(tokenId)).to.eq(true);
        // reset transfer lock
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      });
    })

    describe('if setShouldPreventTransferWhenLocked is false', async () => {
      let tokenId: string

      before(async () => {
        const tx = await lgtNFT['mint()']();
        const txReceipt = await tx.wait()
        const event = txReceipt.events?.find((ev: Event) => {
          return ev.event == 'Transfer'
        })
        tokenId = event?.args?.tokenId
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      })

      it('should pass even if token is locked', async () => {
        // reset transfer lock
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
        const tx = await lgtNFT.transferFrom(deployerAddress, addr1.address, tokenId);
        await tx.wait()
        expect(await lgtNFT.getTokenLock(tokenId)).to.eq(true);
      });
    })
  });
  //
  describe('setBaseURI', async () => {
    let tokenId1: string, tokenId2: string
    let ogTokenLock1: boolean, ogTokenLock2: boolean
    before(async () => {
      const totalSupply = (await lgtNFT.totalSupply()).toNumber()
      tokenId1 = Math.floor(Math.random() * totalSupply).toString()
      tokenId2 = Math.floor(Math.random() * totalSupply).toString()
      ogTokenLock1 = await lgtNFT.getTokenLock(tokenId1)
      ogTokenLock2 = await lgtNFT.getTokenLock(tokenId2)
      await lgtNFT.setTokenLock(tokenId1, true)
      await lgtNFT.setTokenLock(tokenId2, true)
    })
    after(async () => {
      await lgtNFT.setTokenLock(tokenId1, ogTokenLock1)
      await lgtNFT.setTokenLock(tokenId2, ogTokenLock2)
    })

    it('returns original baseURI', async () => {
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/locked`);
      expect(result2.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/locked`);
    });
    it('sets new base uri and returns new metadata uri', async () => {
      await lgtNFT.setBaseURI("https://somethingelse.com")
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://somethingelse.com/locked`);
      expect(result2.toLowerCase()).to.eq(`https://somethingelse.com/locked`);
    });
  })

  describe('token locks', () => {
    let tokenId1: string, tokenId2: string
    let ogTokenLock1: boolean, ogTokenLock2: boolean
    before(async () => {
      const totalSupply = (await lgtNFT.totalSupply()).toNumber()
      tokenId1 = Math.floor(Math.random() * totalSupply).toString()
      tokenId2 = Math.floor(Math.random() * totalSupply).toString()
      ogTokenLock1 = await lgtNFT.getTokenLock(tokenId1)
      ogTokenLock2 = await lgtNFT.getTokenLock(tokenId2)
      await lgtNFT.setTokenLock(tokenId1, true)
      await lgtNFT.setTokenLock(tokenId2, true)
    })
    after(async () => {
      await lgtNFT.setTokenLock(tokenId1, ogTokenLock1)
      await lgtNFT.setTokenLock(tokenId2, ogTokenLock2)
    })

    describe('setTokenLock', async () => {

      it('allows owner to set token lock', async () => {
        const tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(true)
        await lgtNFT.setTokenLock(tokenId1, false)
      })
      it('setting a token to unlocked changes the metadata url', async () => {
        const tokenUri = await lgtNFT.tokenURI(tokenId1)
        expect(tokenUri.toLowerCase()).to.eq(`https://somethingelse.com/${tokenId1}`)
      })
      it('if a token is unlocked, getTokenLock returns false', async () => {
        const tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(false)
      })
      it('does not allow non API_DELEGATE_ROLE user to set token lock', async () => {
        await expect(lgtNFT.connect(addr1).setTokenLock(tokenId1, false)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
      })
    })
    describe('_afterTokenTransfer', async () => {
      const tokenLock = await lgtNFT.getTokenLock(tokenId2)
      expect(tokenLock).to.eq(true)
      await lgtNFT.setTokenLock(tokenId2, false)

      await lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId2);

      it('automatically locks a token after a transfer', async () => {
        expect(await lgtNFT.getTokenLock(tokenId2)).to.eq(true)
      })
    })
  })

  describe('misc.', () => {
    let tokenId1: string, tokenId2: string
    let mintToAddress

    before(async () => {
      mintToAddress = addr1.address
      const tx = await lgtNFT['mint(address)'](mintToAddress);
      const txReceipt = await tx.wait()
      const tokens: string[] = []
      txReceipt?.events?.forEach(async (ev: Event) => {
        const {event, args} = ev
        expect(event).to.eq('Transfer')
        tokens.push(args?.tokenId)
      })
      tokenId1 = tokens[0]
      const tx2 = await lgtNFT['mint(address)'](addrWithNoRoles.address);
      const txReceipt2 = await tx2.wait()
      txReceipt2?.events?.forEach(async (ev: Event) => {
        const {event, args} = ev
        expect(event).to.eq('Transfer')
        tokens.push(args?.tokenId)
      })
      tokenId2 = tokens[1]
    })
    describe('setIsServiceActive', () => {
      it('allows owner to set service status', async () => {
        await lgtNFT.setIsServiceActive(true)
      })
      it('turns off token lock when status is off', async () => {
        await lgtNFT.setTokenLock(tokenId1, true)
        let tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(true)
        await lgtNFT.setIsServiceActive(false)
        tokenLock = await lgtNFT.getTokenLock(tokenId1)
        expect(tokenLock).to.eq(false)
        let serviceStatus = await lgtNFT.getIsServiceActive()
        expect(serviceStatus).to.eq(false)
        await lgtNFT.setIsServiceActive(true)
        serviceStatus = await lgtNFT.getIsServiceActive()
        expect(serviceStatus).to.eq(true)
      })
      it('does not allow non-owner to set service status', async () => {
        await expect(lgtNFT.connect(addr1).setIsServiceActive(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
      })
    })
    describe('roles', () => {
      describe('DEFAULT_ADMIN', async () => {
        it('allows admin to call setShouldLockTokensAfterMint', async () => {
          await lgtNFT.setShouldLockTokensAfterMint(false)
        })
        it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
          await expect(lgtNFT.connect(addr1).setShouldLockTokensAfterMint(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
          //reset
          await lgtNFT.setShouldLockTokensAfterMint(true)
        })
        it('allows admin to call setShouldPreventTransferWhenLocked', async () => {
          await lgtNFT.setShouldPreventTransferWhenLocked(false)
        })
        it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
          await expect(lgtNFT.connect(addr1).setShouldPreventTransferWhenLocked(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
          //reset
          await lgtNFT.setShouldPreventTransferWhenLocked(true)
        })
      })
      describe('API_DELEGATE_USER', async () => {
        it('allows admin to grant and revoke API_DELEGATE_USER role', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
        })
        it('allows API_DELEGATE_USER to call setTokenLock', async () => {
          await lgtNFT.connect(addr1).setTokenLock(tokenId1, false)
        })
        it('does not allow non API_DELEGATE_USER to call setTokenLock', async () => {
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
          await expect(lgtNFT.connect(addr1).setTokenLock(tokenId1, false)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
        })
      })
      describe('NFT_MANAGER_USER', async () => {
        it('allows admin to grant and revoke NFT_MANAGER_USER role', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
        })
      })
      describe('TOKEN_RECOVERY_USER', async () => {
        it('allows admin to grant and revoke TOKEN_RECOVERY_USER role', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), addr1.address)
        })
        it('allows TOKEN_RECOVERY_USER to call recoverToken', async () => {
          await lgtNFT.connect(addr1).recoverToken(tokenId1)
        })
        it('does not allow non TOKEN_RECOVERY_USER to call recoverToken', async () => {
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), addr1.address)
          await expect(lgtNFT.connect(addr1).recoverToken(tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_RECOVERY)
        })
      })
      describe('SERVICE_STATUS_MANAGER_USER', async () => {
        it('allows ADMIN to grant and revoke SERVICE_STATUS_MANAGER_USER role', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
        })
        it('allows SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
          await lgtNFT.connect(addr1).setIsServiceActive(false)
          await lgtNFT.connect(addr1).setIsServiceActive(true)
        })
        it('does not allow non SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
          await expect(lgtNFT.connect(addr1).setIsServiceActive(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
        })
      })
    })
    describe('recoverToken', () => {
      it('TOKEN_RECOVERY_USER can recover a token from another address', async () => {
        let owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.not.eq(deployerAddress)

        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), deployerAddress)
        await lgtNFT.recoverToken(tokenId2)
        owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.eq(deployerAddress)
      })
      describe('while shouldPreventTransferWhenLocked is true', () => {
        it('TOKEN_RECOVERY_USER can still recover token from another address', async () => {
          const tokenRecoveryUser = addr1.address;
          let owner = await lgtNFT.ownerOf(tokenId2)
          expect(owner).to.not.eq(tokenRecoveryUser)


          await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), tokenRecoveryUser)

          // token lock on
          await lgtNFT.setShouldPreventTransferWhenLocked(true)
          await lgtNFT.connect(addr1).recoverToken(tokenId2)
          owner = await lgtNFT.ownerOf(tokenId2)
          expect(owner).to.eq(addr1.address)

          // token lock off
          await lgtNFT.setShouldPreventTransferWhenLocked(false)
          await lgtNFT.recoverToken(tokenId2)
          owner = await lgtNFT.ownerOf(tokenId2)
          expect(owner).to.eq(deployerAddress)
        })
      })
    })
    describe('claim', () => {
      it('API_DELEGATE can perform claim function and send NFT to Tap end consumer', async () => {
        expect(await lgtNFT.ownerOf(tokenId2)).to.eq(deployerAddress)

        await lgtNFT.claim(addr2.address, tokenId2)

        const owner = await lgtNFT.ownerOf(tokenId2)
        expect(owner).to.eq(addr2.address)
        const tokenLock = await lgtNFT.getTokenLock(tokenId2)
        expect(tokenLock).to.eq(false)
        await lgtNFT.recoverToken(tokenId2)
      })
      describe('while shouldPreventTransferWhenLocked is true', () => {
        it('API_DELEGATE can still perform claim function and send NFT to Tap end consumer', async () => {
          await lgtNFT.setShouldPreventTransferWhenLocked(true)
          await lgtNFT.claim(addr1.address, tokenId2)

          const owner = await lgtNFT.ownerOf(tokenId2)
          expect(owner).to.eq(addr1.address)
          const tokenLock = await lgtNFT.getTokenLock(tokenId2)
          expect(tokenLock).to.eq(false)
          await lgtNFT.setShouldPreventTransferWhenLocked(false)
        })
      })
    })
  })
})
