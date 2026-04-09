pragma circom 2.1.6;
include "../node_modules/circomlib/circuits/comparators.circom";

template EmissionRangeProof() {
    // Private input (the actual proprietary emissions data)
    signal input emissions;
    // Public input (the maximum allowed threshold)
    signal input threshold;
    // Output (1 if valid, 0 if invalid)
    signal output isWithinRange;

    // Compare if emissions < threshold (up to 64 bits)
    component lt = LessThan(64);
    lt.in[0] <== emissions;
    lt.in[1] <== threshold;

    isWithinRange <== lt.out;
    
    // Force the circuit to fail if it's over the threshold
    isWithinRange === 1;
}

// Only the threshold is public; emissions stay private
component main {public [threshold]} = EmissionRangeProof();