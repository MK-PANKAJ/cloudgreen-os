#!/usr/bin/env node
/**
 * Proper ZK Proof Generation
 * Generates a valid proof using the EmissionRangeProof Circom circuit
 */

const path = require('path');
const snarkjs = require('snarkjs');

async function generateValidProof() {
  try {
    console.log('🔐 GENERATING VALID ZK PROOF FOR EMISSION RANGE\n');
    console.log('═'.repeat(70));
    
    // Setup paths
    const circuitDir = path.join(__dirname, 'EmissionRangeProof_js');
    const wasmPath = path.join(circuitDir, 'EmissionRangeProof.wasm');
    const zkeyPath = path.join(__dirname, 'circuit_0000.zkey');
    const vkeyPath = path.join(__dirname, 'verification_key.json');
    
    // Input values for the circuit
    // Private input: emissions = 150 tons CO2
    // Public input: thresho
    // Expected: emissions < thresholdld = 200 tons CO2 = TRUE (proof valid)
    const input = {
      emissions: '150',
      threshold: '200'
    };
    
    console.log('\n📊 CIRCUIT INPUTS:');
    console.log(`   Emissions (private):  ${input.emissions} tons CO2`);
    console.log(`   Threshold (public):   ${input.threshold} tons CO2`);
    console.log(`   Expected Result:      emissions < threshold = TRUE ✓\n`);
    
    // Step 1: Generate witness + proof in one call from wasm + zkey paths
    console.log('⚙️  STEP 1: Generating Witness + Proof...');
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
    console.log('   ✅ Witness generated');
    console.log('   ✅ Proof generated\n');
    
    // Step 2: Verify proof
    console.log('⚙️  STEP 2: Verifying Proof Locally...');
    const { readFileSync } = require('fs');
    const vkey = JSON.parse(readFileSync(vkeyPath, 'utf8'));
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    if (isValid) {
      console.log('   ✅ PROOF VERIFIED SUCCESSFULLY! ✓\n');
    } else {
      console.log('   ❌ Proof verification failed!\n');
    }
    
    // Format for API
    const proofForAPI = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: proof.protocol,
      curve: proof.curve
    };
    
    const publicSignalsForAPI = publicSignals.map(s => s.toString());
    
    const payload = {
      proof: proofForAPI,
      publicSignals: publicSignalsForAPI,
      supplierId: 'supplier-001',
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat Account #1
    };
    
    console.log('═'.repeat(70));
    console.log('\n📤 API PAYLOAD (VALID PROOF):\n');
    console.log('\n' + '═'.repeat(70));
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n✨ Ready to test! Execute:\n');
    console.log(`curl -X POST http://localhost:8787/api/zk/verify \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '${JSON.stringify(payload)}'`);
    console.log();
    
    return payload;
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run it
generateValidProof().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
