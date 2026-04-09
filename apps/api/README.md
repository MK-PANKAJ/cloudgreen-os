# API circuit setup

This package includes the `EmissionRangeProof` Circom circuit in [circuits/EmissionRangeProof.circom](circuits/EmissionRangeProof.circom).

## Prerequisites

- Install Circom 2.x and make sure `circom` is on your `PATH`.
- Keep `circomlib` installed in this package with `pnpm add circomlib`.

`circom` is not provided by pnpm or npm here, so the compiler must come from a separate Circom installation.

## Build the circuit

From `apps/api`, run:

```powershell
pnpm run circuit:compile
npx --yes snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
npx --yes snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="local contribution" -e="cloudgreen os local entropy"
npx --yes snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
npx --yes snarkjs groth16 setup EmissionRangeProof.r1cs pot12_final.ptau circuit_0000.zkey
npx snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json
```

The public ptau download from the upstream S3 bucket was not reachable from this Windows shell, so the local snarkjs-generated ptau path above is the reliable fallback here.

## Output files

- `EmissionRangeProof.r1cs`
- `EmissionRangeProof_js/`
- `EmissionRangeProof.sym`
- `pot12_0000.ptau`
- `pot12_0001.ptau`
- `pot12_final.ptau`
- `circuit_0000.zkey`
- `verification_key.json`