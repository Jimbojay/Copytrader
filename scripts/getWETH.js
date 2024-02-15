const TOKEN_ABI = require('../src/abis/WETH.json');

const { ethers } = require("hardhat");

async function checkIfForked() {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(`Current Block Number: ${blockNumber}`);

  // Optionally, check the network
  const network = await ethers.provider.getNetwork();
  console.log(`Current Network: ${network.name} (${network.chainId})`);
}

checkIfForked();

async function main() {
  const [signer] = await ethers.getSigners(); // Get the first signer
  const amount = ethers.utils.parseEther("10"); // Amount of ETH you want to wrap

  // WETH contract address and ABI (including the balanceOf function)
  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // const wethABI = [
  //   "function deposit() payable",
  //   "function balanceOf(address) view returns (uint)"
  // ];

  const wethABI = TOKEN_ABI;

  // console.log(`wethABI: ${wethABI}`);

  // Create a contract instance
  const wethContract = new ethers.Contract(wethAddress, wethABI, signer);

  console.log(`Signer: ${signer.address}`);
  // console.log(`wethContract ${wethContract}`);
  // console.log("wethContract", JSON.stringify(wethContract, null, 2));

  // Log the WETH balance before the deposit

  try {
    let balance = await wethContract.balanceOf(signer.address);
    console.log(`WETH Balance before deposit: ${ethers.utils.formatEther(balance)} WETH`);
  } catch (error) {
    console.error('Balance error:',  error);
  }

  // Wrap ETH into WETH
  const tx = await wethContract.deposit({ value: amount });
  await tx.wait();

  console.log(tx)

  // Log the WETH balance after the deposit
  // balance = await wethContract.balanceOf(signer.address);
  // console.log(`WETH Balance after deposit: ${ethers.utils.formatEther(balance)} WETH`);

  console.log(`Wrapped ${ethers.utils.formatEther(amount)} ETH into WETH`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
