import { getAddressBook } from './utils'

async function main() {
  const addressBook = await getAddressBook()

  // @ts-expect-error
  await hre.run("verify:verify", {
    address: addressBook.Contracts.LegitimatePhygitalNFTv3,
    constructorArguments: []
  })
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
