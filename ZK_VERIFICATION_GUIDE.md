# 🔐 ZK Proof Verification Endpoint Testing Guide

## Endpoint Overview

**POST** `http://localhost:8787/api/zk/verify`

### Purpose
Verifies zero-knowledge proofs from the EmissionRangeProof Circom circuit and rewards suppliers with GCRD tokens on the blockchain if the proof is valid.

---

## Endpoint Behavior

### ✅ Success Flow (Valid Proof)
```
Request:  POST /api/zk/verify with valid {proof, publicSignals, walletAddress}
         ↓
Verification: verifyEmissionProof(proof, publicSignals)
         ↓
Response:  {"success": true, "message": "...", "reward": {...}, "transactionHash": "..."}
         ↓
Blockchain: Mints 100 GCRD tokens to walletAddress
```

### ❌ Failure Flows
1. **Missing Parameters:**
   ```json
   {
     "error": "Missing proof, publicSignals, or walletAddress payload"
   }
   ```

2. **Invalid Proof:**
   ```json
   {
     "success": false,
     "message": "Invalid ZK Proof. Verification failed."
   }
   ```

---

## EmissionRangeProof Circuit Details

**Location:** `/apps/api/circuits/EmissionRangeProof.circom`

**Circuit Logic:**
- **Private Input:** `emissions` - Actual CO2 emissions (kept confidential)
- **Public Input:** `threshold` - Maximum allowed emissions threshold
- **Output:** `isWithinRange` - Must equal 1 (true) for valid proof
- **Constraint:** `emissions < threshold`

**Example:** 
- Emissions: 150 tons CO2 (private)
- Threshold: 200 tons CO2 (public)
- Valid: YES (150 < 200) ✓

---

## Testing the Endpoint

### Method 1: Using PowerShell (Windows)

```powershell
$payload = @{
  proof = @{
    pi_a = @("...", "...")
    pi_b = @(@("...", "..."), @("...", "..."))
    pi_c = @("...", "...")
    protocol = "groth16"
    curve = "bn128"
  }
  publicSignals = @("1", "200", "1")  # threshold=200, isWithinRange=1
  supplierId = "supplier-001"
  walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
} | ConvertTo-Json -Depth 10

Invoke-WebRequest `
  -Uri "http://localhost:8787/api/zk/verify" `
  -Method POST `
  -ContentType "application/json" `
  -Body $payload
```

### Method 2: Using curl (Any Platform)

```bash
curl -X POST http://localhost:8787/api/zk/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {
      "pi_a": [...],
      "pi_b": [...],
      "pi_c": [...],
      "protocol": "groth16",
      "curve": "bn128"
    },
    "publicSignals": ["1", "200", "1"],
    "supplierId": "supplier-001",
    "walletAddress": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  }'
```

### Method 3: Generated Valid Proof

Run the proof generator to create a valid proof:

```bash
cd apps/api
node generate-valid-proof.cjs
```

This will output a complete payload ready to POST.

---

## Valid Wallet Addresses (Hardhat Test Accounts)

For local testing with the Hardhat node:

| Account | Address | PrivateKey |
|---------|---------|-----------|
| #0 (Deployer) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812e339D9B73B0245ad59419D51E5` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900c6671B362144b622c8670DA06a` | `0x5de4111afa1a4b94908f83103db1fb1da5c4cc5803fc1edddc26b7b2365e7c68` |

---

## Flow Diagram

```
Client
  ↓
POST /api/zk/verify
  ├─ proof
  ├─ publicSignals
  ├─ supplierId
  └─ walletAddress
  ↓
fastify.post('/api/zk/verify')
  ↓
verifyEmissionProof(proof, publicSignals)
  ├─ Load vkey from verification_key.json
  ├─ snarkjs.groth16.verify(vkey, publicSignals, proof)
  └─ Return boolean
  ↓
If VALID:
  ├─ rewardSupplier(walletAddress, 100)
  ├─ Connect to Hardhat node (8545)
  ├─ Call GreenCredit.mintReward(walletAddress, 100)
  └─ Return {success: true, reward: {...}, txHash}
  ↓
If INVALID:
  └─ Return {success: false, message: "..."}
  ↓
Response (JSON)
```

---

## Response Examples

### Valid Proof Successfully Verified ✓

```json
{
  "success": true,
  "message": "ZK Proof verified successfully for supplier-001.",
  "reward": {
    "tokens": 100,
    "currency": "GCRD",
    "transactionHash": "0x1234567890abcdef..."
  }
}
```

### Invalid Proof ✗

```json
{
  "success": false,
  "message": "Invalid ZK Proof. Verification failed."
}
```

---

## Integration Example: Complete Workflow

1. **Supplier generates proof locally** (off-chain)
   - Runs `circom EmissionRangeProof.circom -o output --proof`
   - Uses witness generator with actual emissions data
   - Gets proof and publicSignals

2. **Supplier calls `/api/zk/verify`**
   - POSTs proof data to endpoint
   - Includes their Ethereum wallet address

3. **API verifies proof**
   - Cryptographically validates proof
   - If valid: mints 100 GCRD tokens to wallet
   - Returns transaction hash

4. **Supplier can verify token receipt**
   - Check token balance in wallet
   - Query blockchain for transaction

---

## Generating Real Proofs

To generate actual valid proofs programmatically:

```bash
# From apps/api directory

# Method 1: Use the included proof generator
node generate-valid-proof.cjs

# Method 2: Manual process using circom CLI
circom circuits/EmissionRangeProof.circom -o circuits/output --proof

# The output includes:
# - proof.json (proof data)
# - public.json (public signals)
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Missing proof..." | Missing required fields | Ensure all 4 fields present: proof, publicSignals, supplierId, walletAddress |
| "Invalid ZK Proof" | Proof doesn't match publicSignals | Generate new proof using the circuit |
| 503 Service Unavailable | Blockchain connection failed | Check Hardhat node is running at `http://localhost:8545` |
| Token mint fails | Contract issue | Verify contract deployed and has minter role |

---

## Current Status

✅ **Endpoint:** Working and reachable
✅ **Proof Verification:** Functional (snarkjs integration)
✅ **Blockchain Integration:** Connected (ethers.js to Hardhat)
✅ **Token Minting:** Ready (GreenCredit contract deployed)

**Test Command:**
```bash
node generate-valid-proof.cjs
```

This generates a fully-formed proof payload that can be immediately POSTed to the endpoint for end-to-end testing.

