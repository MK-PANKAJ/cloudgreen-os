import { ethers } from 'ethers';

// 1. Connect to the local Hardhat node running on port 8545
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// 2. The well-known private key for Hardhat Account #0 (DO NOT USE IN PRODUCTION)
const ADMIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

// 3. YOUR Deployed Contract Address
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// 4. A minimal ABI (Application Binary Interface) just for the function we need
const abi = [
  "function mintReward(address supplierWallet, uint256 amount) public"
];

const greenCreditContract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet) as any;

export async function rewardSupplier(supplierWallet: string, amount: number) {
  try {
    console.log(`🪙  [Web3] Minting ${amount} GCRD tokens to ${supplierWallet}...`);
    
    // Call the smart contract function
    if (!greenCreditContract.mintReward) {
      throw new Error('mintReward method not found on contract');
    }
    const tx = await greenCreditContract.mintReward(supplierWallet, amount);
    
    // Wait for the block to be mined (nearly instant on local network)
    const receipt = await tx.wait();
    
    console.log(`✅  [Web3] Tokens minted successfully! Transaction Hash: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error("🚨 [Web3] Failed to mint reward tokens:", error);
    return null;
  }
}