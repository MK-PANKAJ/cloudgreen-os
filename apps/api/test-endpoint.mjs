#!/usr/bin/env node
/**
 * Test the /api/zk/verify endpoint
 * Demonstrates the complete flow with documented payload structure
 */

import axios from 'axios';

const API_URL = 'http://localhost:8787/api/zk/verify';

// Example proof structure (values are for demonstration)
// In production, these would be generated using:
// 1. Circom circuit compilation
// 2. Witness generation from actual emissions data
// 3. snarkjs.groth16.prove() with the proving key
const testPayload = {
  proof: {
    pi_a: [
      "18903649476149282055319929283895813234892913341930537527733820435797936151127",
      "10843121278207849651843934154063025976959485318887589752938969597868393518970"
    ],
    pi_b: [
      [
        "8904813030797099319246155039639936673814923635926373344095768629297175629030",
        "17976725022230487879813046868900155370254005175897241087283929408638283945159"
      ],
      [
        "3555626857936821126318556253934905948099155568245896885226038234768301769661",
        "11024768988925087263934768769813788435916936029395949074070074197626873046098"
      ]
    ],
    pi_c: [
      "17627880699076089231268301944889968893254256176937815733555857533038925234689",
      "8005815881627346181733099346256923835235833865260825968223518206929898024476"
    ],
    protocol: "groth16",
    curve: "bn128"
  },
  publicSignals: ["1", "200", "1"],
  supplierId: "supplier-001",
  walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
};

async function testEndpoint() {
  console.log('🧪 TESTING /api/zk/verify ENDPOINT\n');
  console.log('═'.repeat(70));
  console.log(`📍 URL: ${API_URL}\n`);

  console.log('📤 Request Payload:');
  console.log(JSON.stringify(testPayload, null, 2));
  console.log('\n' + '─'.repeat(70) + '\n');

  try {
    console.log('⏳ Sending request...\n');
    const response = await axios.post(API_URL, testPayload);

    console.log('✅ Response Received!\n');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 PROOF VERIFIED! Tokens minted.');
    } else {
      console.log('\n❌ Proof verification failed (expected with test data)');
      console.log('Reason:', response.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('⚠️  API Response Error\n');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection Refused');
      console.log('Make sure the API is running at http://localhost:8787');
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('\n📚 Documentation:');
  console.log('   See ZK_VERIFICATION_GUIDE.md for complete details');
  console.log('   - Proof structure requirements');
  console.log('   - Valid wallet addresses');
  console.log('   - How to generate real proofs');
  console.log('   - Integration examples');
}

testEndpoint().catch(console.error);
