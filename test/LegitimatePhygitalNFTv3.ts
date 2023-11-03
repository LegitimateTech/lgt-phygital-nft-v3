import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai'
import {BigNumber, Contract, Event} from 'ethers';
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
const OWNABLE_CALLER_IS_NOT_APPROVED_NOR_OWNER = 'Locked721: Caller is not approved nor owner'
const TOKEN_NOT_UNLOCKED = 'Please unlock your NFT by tapping the LGT Tag before transferring.'
const NONEXISTANT_TOKEN = 'ERC721: owner query for nonexistent token'

describe('LegitimatePhygitalNFTv3', () => {
  let addr1: SignerWithAddress
  let addr2: SignerWithAddress
  let tokenId1: string
  let tokenId2: string
  let addrWithNoRoles: SignerWithAddress
  let lgtNFT: Contract;
  let deployerAddress: string;
  let initialSupply: BigNumber

  // helper function
  const mintToken = async (_address?: string) => {
    const address = _address || deployerAddress
    const startTokenId = await lgtNFT.totalSupply()
    const tx = await lgtNFT['mint(address,uint256,uint256)'](address, startTokenId.toNumber(), 1);
    const txReceipt = await tx.wait()
    const ev = txReceipt?.events?.find(async (ev: Event) => {
      return ev.event === 'Transfer'
    })
    const {args} = ev
    return args?.tokenId
  }

  before(async () => {
    deployerAddress = await getDeployerAddress()
    const signers = await ethers.getSigners()
    addr1 = signers[1]
    addr2 = signers[2]
    addrWithNoRoles = signers[3]
  })

  beforeEach(async () => {
    // redeploy contract to reset state
    //console.log('afterEach: redeploying contract');
    const LGTNFT = await ethers.getContractFactory("LegitimatePhygitalNFTv3");
    lgtNFT = await LGTNFT.deploy();
    await lgtNFT.deployed();
    tokenId1 = await mintToken(addr1.address)
    tokenId2 = await mintToken(addr2.address)
    initialSupply = (await lgtNFT.totalSupply())
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
      it('can fetch baseURI', async () => {
        await lgtNFT.baseURI()
      })
      it('allows NFT_MANAGER_USER to call setBaseURI', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('NFT_MANAGER_USER')), addr1.address)
        await lgtNFT.connect(addr1).setBaseURI("https://newbaseuri.com")
        const newBaseURI = await lgtNFT.baseURI()
        expect(newBaseURI).to.eq('https://newbaseuri.com')
      })
      it('does not allow non NFT_MANAGER_USER to call setBaseURI', async () => {
        await expect(lgtNFT.connect(addr1).setBaseURI("https://newbaseuri.com")).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER)
      })
    })
    describe('isServiceActive', async () => {
      it('allows SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
        await lgtNFT.connect(addr1).setIsServiceActive(false)
      })
      it('does not allow non SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
        await expect(lgtNFT.connect(addr1).setIsServiceActive(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
      })
    })
    describe('shouldLockTokensAfterMint', async () => {
      it('allows admin to call setShouldLockTokensAfterMint', async () => {
        await lgtNFT.setShouldLockTokensAfterMint(false)
      })
      it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
        await expect(lgtNFT.connect(addr1).setShouldLockTokensAfterMint(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
      })
    })
    describe('shouldPreventTransferWhenLocked', async () => {
      it('allows admin to call setShouldPreventTransferWhenLocked', async () => {
        await lgtNFT.setShouldPreventTransferWhenLocked(false)
      })
      it('does not allow non-admin to call setShouldLockTokensAfterMint', async () => {
        await expect(lgtNFT.connect(addr1).setShouldPreventTransferWhenLocked(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_ADMIN)
      })
    })
  })

  describe('mint(uint256), mint(address,uint256,uint256)', async () => {
    let startTokenId: BigNumber
    before(async () => {
      startTokenId = (await lgtNFT.totalSupply()).toNumber()
    })
    it('user without NFT_MANAGER_USER role cannot mint', async () => {
      await expect(lgtNFT.connect(addrWithNoRoles)['mint(uint256)'](startTokenId)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER);
      await expect(lgtNFT.connect(addrWithNoRoles)['mint(address,uint256,uint256)'](addr1.address, 1, 3)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_NFT_MANAGER);
      expect(initialSupply).to.eq(2)
    })
    describe('mint(uint256)', async () => {
      //SUCCESS
      it('increments the total supply by 1', async () => {
        const tx = await lgtNFT['mint(uint256)'](startTokenId);
        await tx.wait()
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply).to.eq(initialSupply.add(1))
      })
      it('emits an event with the right args', async () => {
        const expectedTokenId = startTokenId.toString()
        const tx = await lgtNFT['mint(uint256)'](startTokenId);
        const txReceipt = await tx.wait()
        const event = txReceipt.events?.find((ev: Event) => {
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
        const tx = await lgtNFT['mint(uint256)'](startTokenId);
        const txReceipt = await tx.wait()
        const event = txReceipt.events?.find((ev: Event) => {
          return ev.event == 'Transfer'
        })
        const tokenId = event?.args?.tokenId
        const owner = await lgtNFT.ownerOf(tokenId)
        expect(owner).to.eq(deployerAddress)
      })
    });
    describe('mint(address,uint256,uint256) – batch minting', async () => {
      let startTokenId: BigNumber
      const numberToMint = 3;

      before(async () => {
        startTokenId = (await lgtNFT.totalSupply()).toNumber()
      })

      //SUCCESS
      it('increments the total supply by numberToMint', async () => {
        const tx = await lgtNFT['mint(address,uint256,uint256)'](addr1.address, startTokenId, numberToMint);
        await tx.wait()
        const totalSupply = await lgtNFT.totalSupply();
        expect(totalSupply).to.eq(initialSupply.add(numberToMint))
      })
      it('emits the right number of "Transfer" events with the right args', async () => {
        const tx = await lgtNFT['mint(address,uint256,uint256)'](addr1.address, startTokenId, numberToMint);
        const txReceipt = await tx.wait()
        const transferEvents = txReceipt?.events?.filter((ev: Event) => ev.event === 'Transfer')
        expect(transferEvents.length).to.eq(numberToMint)

        transferEvents.forEach(async (ev:Event, i: number) => {
          const {event, args} = ev
          expect(event).to.eq('Transfer')
          expect(args?.tokenId).to.eq(i, 'id is correct')
          expect(args?.from).to.eq(ORIGIN_ADDRESS, 'from is correct')
          expect(args?.to).to.eq(addr1.address, 'to is correct')
        })
      })
      it('emits the right number of "Locked" events with the right args', async () => {
        const tx = await lgtNFT['mint(address,uint256,uint256)'](addr1.address, startTokenId, numberToMint);
        const txReceipt = await tx.wait()
        const transferEvents = txReceipt?.events?.filter((ev: Event) => ev.event === 'Locked')
        expect(transferEvents.length).to.eq(numberToMint)

        transferEvents.forEach(async (ev:Event, i: number) => {
          const {event, args} = ev
          expect(event).to.eq('Locked')
          expect(args?.tokenId).to.eq(i, 'id is correct')
          const tokenLock = await lgtNFT.locked(args?.tokenId)
          expect(tokenLock).to.eq(true)
        })
      })
      it('the owner of the tokenIDs is correct', async () => {
        const tx = await lgtNFT['mint(address,uint256,uint256)'](addr1.address, startTokenId, numberToMint);
        const txReceipt = await tx.wait()
        const transferEvents = txReceipt?.events?.filter((ev: Event) => ev.event === 'Transfer')
        expect(transferEvents.length).to.eq(numberToMint)

        transferEvents.forEach(async (ev:Event) => {
          const {event, args} = ev
          expect(event).to.eq('Transfer')
          const tokenId = args?.tokenId
          const owner = await lgtNFT.ownerOf(tokenId)
          expect(owner).to.eq(addr1.address)
        })
      })
    });
    describe('minting NFTs with flag shouldLockTokensAfterMint set to false', async () => {
      let startTokenId: BigNumber
      const numberToMint = 3

      beforeEach(async () => {
        startTokenId = (await lgtNFT.totalSupply()).toNumber()
        await lgtNFT.setShouldLockTokensAfterMint(false);
      })
      it('mint(uint256)', async () => {
        const tx = await lgtNFT['mint(uint256)'](startTokenId);
        const txReceipt = await tx.wait()
        txReceipt?.events?.forEach(async (ev: Event) => {
          const {args} = ev
          const tokenId = args?.tokenId
          const tokenLocked = await lgtNFT.locked(tokenId)
          expect(tokenLocked).to.eq(false)
        })
      })
      it('mint(address,uint256,uint256)', async () => {
        const tx = await lgtNFT['mint(address,uint256,uint256)'](addr1.address, startTokenId, numberToMint);
        const txReceipt = await tx.wait()
        txReceipt?.events?.forEach(async (ev: Event) => {
          const {args} = ev
          const tokenId = args?.tokenId
          const tokenLocked = await lgtNFT.locked(tokenId)
          expect(tokenLocked).to.eq(false)
        })
      })
    })
  })
  //
  describe('transferring', async () => {
    describe('if shouldPreventTransferWhenLocked is true', async () => {
      it('should revert if token is locked', async () => {
        const tokenId = await mintToken(addr1.address)
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(true)

        await expect(lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId)).to.be.revertedWith(TOKEN_NOT_UNLOCKED);
      })
      it('no roles should be able to transfer tokens if transfer lock is set', async () => {
        const tokenId = await mintToken(addr1.address)
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(true)

        // no roles should be able to transfer locked NFT when transfer lock is set
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), addr1.address)
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('DEFAULT_ADMIN_ROLE')), addr1.address)
        await expect(lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId)).to.be.revertedWith(TOKEN_NOT_UNLOCKED);
      })
      it('should pass if token is unlocked, and lock the token after transfer', async () => {
        const tokenId = await mintToken(addr1.address)
        await lgtNFT.setTokenLock(tokenId, false)

        const tx = await lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);
        const txReceipt = await tx.wait()

        //SUCCESS
        const event = txReceipt.events[0].args;
        expect(event.tokenId.toString()).to.eq(tokenId, 'id is correct');
        expect(event.from).to.eq(addr1.address, 'from is correct');
        expect(event.to).to.eq(addr2.address, 'to is correct')
        const owner = await lgtNFT.ownerOf(tokenId);
        expect(owner, addr2.address);
        expect(await lgtNFT.locked(tokenId)).to.eq(true);
      });
    })

    describe('if shouldPreventTransferWhenLocked is false', async () => {
      it('should pass even if token is locked', async () => {
        const tokenId = await mintToken()

        await lgtNFT.setShouldPreventTransferWhenLocked(false)

        const tx = await lgtNFT.transferFrom(deployerAddress, addr1.address, tokenId);
        await tx.wait()
        expect(await lgtNFT.locked(tokenId)).to.eq(true);
      });
    })
  });
  //
  describe('setBaseURI', async () => {
    it('returns original baseURI', async () => {
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/${tokenId1}`);
      expect(result2.toLowerCase()).to.eq(`https://metadata.legitimate.tech/example/${tokenId2}}`);
    });
    it('sets new base uri and returns new metadata uri', async () => {
      await lgtNFT.setBaseURI("https://somethingelse.com")
      const result = await lgtNFT.tokenURI(tokenId1);
      const result2 = await lgtNFT.tokenURI(tokenId2);

      //SUCCESS
      expect(result.toLowerCase()).to.eq(`https://somethingelse.com/${tokenId1}`);
      expect(result2.toLowerCase()).to.eq(`https://somethingelse.com/${tokenId2}}`);
    });
  })

  describe('token locks', () => {
    describe('setTokenLock', async () => {
      beforeEach(async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
      })
      it('allows API_DELEGATE_USER to set token lock', async () => {
        const tokenId = mintToken()
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(true)
        await lgtNFT.connect(addr1).setTokenLock(tokenId, false)
        expect(await lgtNFT.locked(tokenId)).to.eq(false)
      })
      it('does not allow non API_DELEGATE_USER to set token lock', async () => {
        const tokenId = mintToken()
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(true)
        await expect(lgtNFT.connect(addr2).setTokenLock(tokenId, false)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
        expect(await lgtNFT.locked(tokenId)).to.eq(true)
      })
      it('setting a token to unlocked changes the metadata url', async () => {
        const tokenId = await mintToken()
        await lgtNFT.setTokenLock(tokenId, false)
        const tokenUri = await lgtNFT.tokenURI(tokenId)
        expect(tokenUri.toLowerCase()).to.eq(`${await lgtNFT.baseURI()}/${tokenId}`)
      })
      it('setting a token to unlocked emits an "Unlocked" event with the right arg', async () => {
        const tokenId = await mintToken()
        const tx = await lgtNFT.setTokenLock(tokenId, false)
        const txReceipt = await tx.wait()
        expect (txReceipt?.events?.length).to.eq(1)
        const [ev] = txReceipt?.events
        expect(ev.event).to.eq("Unlocked")
        expect(ev.args?.tokenId).to.eq(tokenId)
      })
      it('if a token is unlocked, locked returns false', async () => {
        const tokenId = mintToken()
        await lgtNFT.setTokenLock(tokenId, false)
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(false)
      })
    })
    describe('getTokenLock and locked', async() => {
      it('return the same result', async () => {
        const tokenId = mintToken(addr1.address)
        expect(await lgtNFT.locked(tokenId)).to.eq(await lgtNFT.getTokenLock(tokenId))
        await lgtNFT.setTokenLock(tokenId, false)
        expect(await lgtNFT.locked(tokenId)).to.eq(await lgtNFT.getTokenLock(tokenId))
      })
    })
    describe('_afterTokenTransfer', async () => {
      it('automatically locks a token after a transfer', async () => {
        const tokenId = mintToken(addr1.address)
        await lgtNFT.setTokenLock(tokenId, false)
        const tokenLock = await lgtNFT.locked(tokenId)
        expect(tokenLock).to.eq(false)

        await lgtNFT.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);

        expect(await lgtNFT.locked(tokenId)).to.eq(true)
      })
    })
  })

  describe('misc.', () => {
    describe('setIsServiceActive', () => {
      it('allows owner to set service status', async () => {
        await lgtNFT.setIsServiceActive(true)
      })
      it('turns off token lock when status is off', async () => {
        await lgtNFT.setTokenLock(tokenId1, true)
        let tokenLock = await lgtNFT.locked(tokenId1)
        expect(tokenLock).to.eq(true)
        await lgtNFT.setIsServiceActive(false)
        tokenLock = await lgtNFT.locked(tokenId1)
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
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
        })
        it('allows API_DELEGATE_USER to call setTokenLock', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)
          await lgtNFT.connect(addr1).setTokenLock(tokenId1, false)
        })
        it('does not allow non API_DELEGATE_USER to call setTokenLock', async () => {
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
          const tokenId = mintToken()
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), addr1.address)
          await lgtNFT.connect(addr1).recoverToken(tokenId)
        })
        it('does not allow non TOKEN_RECOVERY_USER to call recoverToken', async () => {
          const tokenId = mintToken()
          await expect(lgtNFT.connect(addr1).recoverToken(tokenId)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_RECOVERY)
        })
      })
      describe('SERVICE_STATUS_MANAGER_USER', async () => {
        it('allows ADMIN to grant and revoke SERVICE_STATUS_MANAGER_USER role', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
          await lgtNFT.revokeRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
        })
        it('allows SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
          await lgtNFT.grantRole(keccak256(toUtf8Bytes('SERVICE_STATUS_MANAGER_USER')), addr1.address)
          await lgtNFT.connect(addr1).setIsServiceActive(false)
          await lgtNFT.connect(addr1).setIsServiceActive(true)
        })
        it('does not allow non SERVICE_STATUS_MANAGER_USER to call setIsServiceActive', async () => {
          await expect(lgtNFT.connect(addr1).setIsServiceActive(true)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_STATUS_MANAGER)
        })
      })
    })
    describe('recoverToken', () => {
      it('TOKEN_RECOVERY_USER can recover a token from another address', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('TOKEN_RECOVERY_USER')), addr2.address)

        await lgtNFT.connect(addr2).recoverToken(tokenId1)

        const owner = await lgtNFT.ownerOf(tokenId1)
        expect(owner).to.eq(addr2.address)
      })
    })
    describe('claim', () => {
      it('API_DELEGATE can perform claim function and send NFT to Tap end consumer', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)

        expect(await lgtNFT.ownerOf(tokenId1)).to.eq(addr1.address)

        await lgtNFT.connect(addr1).claim(addr2.address, tokenId1)

        const owner = await lgtNFT.ownerOf(tokenId1)
        expect(owner).to.eq(addr2.address)
        const tokenLock = await lgtNFT.locked(tokenId1)
        expect(tokenLock).to.eq(false)
      })
      it('non API_DELEGATE cannot perform claim function and send NFT to Tap end consumer', async () => {
        expect(await lgtNFT.ownerOf(tokenId1)).to.eq(addr1.address)

        await expect(lgtNFT.connect(addr1).claim(addr2.address, tokenId1)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_API_DELEGATE)
      })
      it('API_DELEGATE cannot perform claim function if they do not own the NFT', async () => {
        await lgtNFT.grantRole(keccak256(toUtf8Bytes('API_DELEGATE_USER')), addr1.address)

        expect(await lgtNFT.ownerOf(tokenId2)).to.eq(addr2.address)

        await expect(lgtNFT.connect(addr1).claim(addr2.address, tokenId2)).to.be.revertedWith(OWNABLE_CALLER_IS_NOT_APPROVED_NOR_OWNER)
      })
    })
  })
})
