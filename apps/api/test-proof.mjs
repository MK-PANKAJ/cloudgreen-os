#!/usr/bin/env node
// Simple proof generation using snarkjs directly
// We'll create minimal valid proof structures for testing

import * as snarkjs from 'snarkjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('🔐 Loading verification key and preparing proof...\n');

  // Load verification key to understand expected proof format
  const vkeyPath = path.join(__dirname, 'verification_key.json');
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));
  
  console.log('✅ Verification key loaded\n');
  console.log('Creating sample proof data...\n');

  // For testing, create a realistic proof structure
  // In production, this would come from snarkjs.groth16.prove()
  const sampleProof = {
    pi_a: [
      '18903649476149282055319929283895813234892913341930537527733820435797936151127',
      '10843121278207849651843934154063025976959485318887589752938969597868393518970'
    ],
    pi_b: [
      [
        '8904813030797099319246155039639936673814923635926373344095768629297175629030',
        '17976725022230487879813046868900155370254005175897241087283929408638283945159'
      ],
      [
        '3555626857936821126318556253934905948099155568245896885226038234768301769661',
        '11024768988925087263934768769813788435916936029395949074070074197626873046098'
      ]
    ],
    pi_c: [
      '17627880699076089231268301944889968893254256176937815733555857533038925234689',
      '8005815881627346181733099346256923835235833865260825968223518206929898024476'
    ],
    protocol: 'groth16',
    curve: 'bn128'
  };

  // Public signals: [threshold, isWithinRange]
  // threshold = 200 (from our emission range proof)
  // isWithinRange = 1 (emissions 100 < threshold 200)
  const samplePublicSignals = [
    '1', // Used as first signal by the protocol
    '200', // threshold (public input)
    '1' // isWithinRange output (must be 1)
  ];

  // Try to verify this proof
  console.log('🔍 Attempting to verify sample proof...');
  try {
    const isValid = await snarkjs.groth16.verify(vkey, samplePublicSignals, sampleProof);
    if (isValid) {
      console.log('✅ Sample proof verified!\n');
    } else {
      console.log('⚠️  Sample proof did not verify (expected for manually created data)\n');
    }
  } catch (err) {
    console.log('📝 Note: Sample proof structure created (verification expected to fail with manual data)\n');
  }

  // Format for API
  const payload = {
    proof: sampleProof,
    publicSignals: samplePublicSignals,
    supplierId: 'supplier-001',
    walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Hardhat Account #1
  };

  console.log('='.repeat(80));
  console.log('📤 PROOF DATA FOR API TESTING:\n');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Usage: POST http://localhost:8787/api/zk/verify');
  console.log('📋 Content-Type: application/json');
  console.log('\nPayload:\n');
  console.log(JSON.stringify(payload, null, 2));
}

main().catch(console.error);
