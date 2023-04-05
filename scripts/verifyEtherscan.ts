import { getAddressBook, getDeployerAddress } from './utils'

async function main() {
  const addressBook = await getAddressBook()

  // @ts-expect-error
  await hre.run("verify:verify", {
    address: addressBook.Contracts.LegitimatePhysicalNFTv3,
    constructorArguments: []
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
