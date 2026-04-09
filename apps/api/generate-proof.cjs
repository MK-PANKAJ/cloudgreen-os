const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

async function generateProof() {
  try {
    console.log('🔐 Generating ZK Proof for EmissionRangeProof...\n');
    
    // Define test inputs
    // emissions = 100 (private input - actual emissions value)
    // threshold = 200 (public input - max allowed threshold)
    // Result: 100 < 200 = true (within range)
    const input = {
      emissions: '100',
      threshold: '200'
    };

    console.log('📝 Input values:');
    console.log(`  - emissions (private): ${input.emissions}`);
    console.log(`  - threshold (public): ${input.threshold}`);
    console.log(`  - isWithinRange expected: 1 (100 < 200)\n`);

    // Load the witness calculator WASM
    const wasmPath = path.join(__dirname, 'EmissionRangeProof_js', 'EmissionRangeProof.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    
    // Get the witness calculator
    const wc = require('./EmissionRangeProof_js/witness_calculator.js');
    const witnessCalculator = await wc(wasmBuffer);
    
    // Calculate witness
    console.log('⚙️  Calculating witness...');
    const witness = await witnessCalculator.calculateWitness(input, 0);
    console.log(`✅ Witness calculated (${witness.length} values)\n`);

    // Load the proving key
    const zkeyPath = path.join(__dirname, 'circuit_0000.zkey');
    const zkey = fs.readFileSync(zkeyPath);

    // Load verification key
    const vkeyPath = path.join(__dirname, 'verification_key.json');
    const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

    // Generate proof
    console.log('🔑 Generating proof with snarkjs...');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkey, witness);
    console.log('✅ Proof generated!\n');

    // Verify the proof locally
    console.log('🔍 Verifying proof locally...');
    const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    console.log(`✅ Local verification: ${isValid ? 'VALID ✓' : 'INVALID ✗'}\n`);

    // Format proof for API
    const proofForAPI = {
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: proof.protocol,
      curve: proof.curve
    };

    // Public signals are the public inputs: [threshold, isWithinRange]
    const publicSignalsForAPI = publicSignals.map(s => s.toString());

    console.log('📤 Proof data ready for API:\n');
    console.log('Proof structure:');
    console.log(`  pi_a: ${JSON.stringify(proof.pi_a)}`);
    console.log(`  pi_b: ${JSON.stringify(proof.pi_b)}`);
    console.log(`  pi_c: ${JSON.stringify(proof.pi_c)}`);
    console.log('\nPublic Signals:');
    console.log(`  ${JSON.stringify(publicSignalsForAPI)}`);

    // Return the data and a valid wallet address
    return {
      proof: proofForAPI,
      publicSignals: publicSignalsForAPI,
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat Account #1
      supplierId: 'supplier-001'
    };

  } catch (error) {
    console.error('❌ Error generating proof:', error);
    process.exit(1);
  }
}

// Generate and test
generateProof().then(data => {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 READY TO TEST API ENDPOINT\n');
  console.log('Use this JSON payload for POST /api/zk/verify:\n');
  console.log(JSON.stringify({
    proof: data.proof,
    publicSignals: data.publicSignals,
    supplierId: data.supplierId,
    walletAddress: data.walletAddress
  }, null, 2));
  console.log('\n' + '='.repeat(80));
});
