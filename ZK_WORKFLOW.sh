#!/usr/bin/env bash

##############################################################################
# ZK Proof Generation & Testing Workflow
# Complete guide for generating and testing valid Circom proofs
##############################################################################

echo "🔐 ZK Proof Generation Workflow"
echo "================================="
echo ""
echo "This script demonstrates the complete process for:"
echo "  1. Compiling the EmissionRangeProof Circom circuit"
echo "  2. Generating a witness from emissions data"
echo "  3. Creating a cryptographic proof"
echo "  4. Testing the proof on the /api/zk/verify endpoint"
echo ""
echo "Prerequisites:"
echo "  - circom CLI installed (npm install -g circom)"
echo "  - snarkjs CLI installed (npm install -g snarkjs)"
echo "  - Hardhat node running on port 8545"
echo "  - API server running on port 8787"
echo ""

##############################################################################
# STEP 1: Circuit Compilation (one-time setup)
##############################################################################

echo "=== STEP 1: Compile Circom Circuit ==="
echo ""
echo "If not already done, compile the circuit:"
echo ""
echo "  cd apps/api"
echo "  circom circuits/EmissionRangeProof.circom \\
        --r1cs \\
        --wasm \\
        --sym \\
        -o circuits/output"
echo ""
echo "This generates:"
echo "  - EmissionRangeProof.r1cs (constraints)"
echo "  - EmissionRangeProof.wasm (witness calculator)"
echo "  - EmissionRangeProof.sym (symbol table)"
echo ""

##############################################################################
# STEP 2: Witness Generation
##############################################################################

echo "=== STEP 2: Generate Witness ==="
echo ""
echo "Create input.json with your emissions data:"
echo ""
echo "  {\"
echo "    \"emissions\": \"150\",    # Private: actual CO2 in tons"
echo "    \"threshold\": \"200\"     # Public: max allowed threshold"
echo "  }"
echo ""
echo "Run witness generator:"
echo ""
echo "  node EmissionRangeProof_js/generate_witness.js \\
        EmissionRangeProof_js/EmissionRangeProof.wasm \\
        input.json \\
        witness.wtns"
echo ""

##############################################################################
# STEP 3: Proof Generation
##############################################################################

echo "=== STEP 3: Generate ZK Proof ==="
echo ""
echo "Using snarkjs CLI:"
echo ""
echo "  npx snarkjs groth16 prove \\
        circuit_0000.zkey \\
        witness.wtns \\
        proof.json \\
        public.json"
echo ""
echo "This produces:"
echo "  - proof.json: {pi_a, pi_b, pi_c, protocol, curve}"
echo "  - public.json: [threshold, isWithinRange]"
echo ""

##############################################################################
# STEP 4: API Testing
##############################################################################

echo "=== STEP 4: Test on /api/zk/verify ==="
echo ""
echo "Format the proof as JSON payload:"
echo ""
echo "  {
echo "    \"proof\": {
echo "      \"pi_a\": [string, string],
echo "      \"pi_b\": [[string, string], [string, string]],
echo "      \"pi_c\": [string, string],
echo "      \"protocol\": \"groth16\",
echo "      \"curve\": \"bn128\"
echo "    },
echo "    \"publicSignals\": [\"...\", \"...\", ...],
echo "    \"supplierId\": \"your-supplier-id\",
echo "    \"walletAddress\": \"0x...\""
echo "  }"
echo ""
echo "POST to the endpoint:"
echo ""
echo "  curl -X POST http://localhost:8787/api/zk/verify \\
        -H \"Content-Type: application/json\" \\
        -d @payload.json"
echo ""

##############################################################################
# STEP 5: Verify Results
##############################################################################

echo "=== STEP 5: Verify Token Reward ==="
echo ""
echo "Successful responses look like:"
echo ""
echo "  {
echo "    \"success\": true,"
echo "    \"message\": \"ZK Proof verified successfully for supplier-001.\","
echo "    \"reward\": {
echo "      \"tokens\": 100,"
echo "      \"currency\": \"GCRD\","
echo "      \"transactionHash\": \"0x...\""
echo "    }
echo "  }"
echo ""
echo "Verify on blockchain:"
echo "  - Check wallet balance at the transactionHash"
echo "  - Query Hardhat node for token transfer events"
echo ""

##############################################################################
# AUTOMATION SCRIPTS
##############################################################################

echo ""
echo "=== Automated Testing ==="
echo ""
echo "Use provided scripts:"
echo ""
echo "1. Proof Generator (generates valid proofs):"
echo "   node generate-valid-proof.cjs"
echo ""
echo "2. Endpoint Tester (posts sample proof):"
echo "   node test-endpoint.mjs"
echo ""
echo "3. Full Integration Test:"
echo "   npm run test:zk  (if configured)"
echo ""

##############################################################################
# REFERENCE: Circom Circuit Logic
##############################################################################

echo ""
echo "=== Circuit Reference ==="
echo ""
echo "EmissionRangeProof Logic:"
echo ""
echo "  INPUT (private): emissions"
echo "  INPUT (public):  threshold"
echo "  OUTPUT:          isWithinRange"
echo ""
echo "  CONSTRAINT: emissions < threshold"
echo "  VALID IF:   isWithinRange == 1"
echo ""
echo "Example:"
echo "  emissions = 150 tons CO2 (proved in zero-knowledge)"
echo "  threshold = 200 tons CO2 (verified on-chain)"
echo "  Result: 150 < 200 → VALID ✓"
echo ""
echo "  Minting reward:"
echo "  walletAddress: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  amount: 100 GCRD tokens"
echo "  status: ✅ Minted on Hardhat blockchain"
echo ""

##############################################################################
# FILES CREATED/MODIFIED
##############################################################################

echo ""
echo "=== Project Files ==="
echo ""
echo "Key files:"
echo "  - apps/api/circuits/EmissionRangeProof.circom"
echo "  - apps/api/EmissionRangeProof_js/witness_calculator.cjs"
echo "  - apps/api/circuit_0000.zkey (proving key)"
echo "  - apps/api/verification_key.json"
echo ""
echo "Generated files (produced by scripts):"
echo "  - input.json (your emissions data)"
echo "  - witness.wtns (from witness generator)"
echo "  - proof.json (from snarkjs)"
echo "  - public.json (from snarkjs)"
echo "  - payload.json (formatted for API)"
echo ""

##############################################################################
# TROUBLESHOOTING
##############################################################################

echo ""
echo "=== Troubleshooting ==="
echo ""
echo "Issue: \"Block producer failed: No available block producer\""
echo "  → Run: npx hardhat node"
echo ""
echo "Issue: \"witness.wtns not found\""
echo "  → Run witness generator first"
echo ""
echo "Issue: \"Invalid circuit_0000.zkey\""
echo "  → Regenerate using: npx snarkjs groth16 setup ..."
echo ""
echo "Issue: Token not transferred"
echo "  → Check: GreenCredit contract deployed at correct address"
echo "  → Check: Hardhat Account #0 is contract owner"
echo ""

echo ""
echo "✅ Setup complete! Now test the endpoint."
echo "   See PROOF_IMPLEMENTATION_SUMMARY.md for more details."
echo ""
