import { ethers } from "ethers";

async function main() {
  // Connect to Hardhat's local node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Use the well-known Hardhat Account #0 private key
  const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  console.log("Deploying GreenCredit contract with account:", wallet.address);

  // Load contract ABI and bytecode
  const GreenCreditArtifact = require("../artifacts/contracts/CloudGreenCredential.sol/CloudGreenCredential.json");
  const factory = new ethers.ContractFactory(GreenCreditArtifact.abi, GreenCreditArtifact.bytecode, wallet);
  const token = await factory.deploy();
  await token.waitForDeployment();

  console.log(`✅ GreenCredit (GCRD) successfully deployed to: ${token.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});