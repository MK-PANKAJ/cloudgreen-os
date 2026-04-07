import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { contexts as credentialsContexts } from '@digitalbazaar/credentials-context';
import securityContext from '@digitalbazaar/security-context';
import { suiteContext } from '@digitalbazaar/ed25519-signature-2020';
import * as vc from '@digitalbazaar/vc';
import crypto from 'node:crypto';

// For MVP, we use a local constant key. In Phase 3, this moves to OpenBao[cite: 91, 139].
const SEED = crypto.randomBytes(32);

const SUITE_CONTEXT_URL = suiteContext.constants.CONTEXT_URL;
const VC_V1_CONTEXT_URL = 'https://www.w3.org/2018/credentials/v1';
const localContexts = new Map<string, unknown>([
  [VC_V1_CONTEXT_URL, credentialsContexts.get(VC_V1_CONTEXT_URL)],
  [SUITE_CONTEXT_URL, suiteContext.contexts.get(SUITE_CONTEXT_URL)],
  [securityContext.SECURITY_CONTEXT_V2_URL, securityContext.contexts.get(securityContext.SECURITY_CONTEXT_V2_URL)],
]);

const documentLoader = async (url: string) => {
  const localDoc = localContexts.get(url);
  if(localDoc) {
    return {
      contextUrl: null,
      documentUrl: url,
      document: localDoc,
    };
  }

  return vc.defaultDocumentLoader(url);
};

export async function issueCarbonCredential(supplierId: string, emissions: number) {
  // 1. Generate a key pair for signing [cite: 137]
  const keyPair = await Ed25519VerificationKey2020.generate({
    seed: SEED,
    controller: 'did:cloudgreen:admin',
    id: 'did:cloudgreen:admin#key-1',
  });
  const suite = new Ed25519Signature2020({
    key: keyPair,
    verificationMethod: keyPair.id,
  });

  // 2. Define the Credential payload [cite: 607]
  const credential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      {
        CarbonFootprintCredential: 'https://cloudgreen.io/vocab#CarbonFootprintCredential',
        carbonEmissions: 'https://cloudgreen.io/vocab#carbonEmissions',
        value: 'https://schema.org/value',
        unit: 'https://schema.org/unitCode',
        verified: 'https://cloudgreen.io/vocab#verified',
      },
    ],
    id: `http://cloudgreen.io/credentials/${crypto.randomUUID()}`,
    type: ['VerifiableCredential', 'CarbonFootprintCredential'],
    issuer: 'did:cloudgreen:admin',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `did:supplier:${supplierId}`,
      carbonEmissions: {
        value: emissions,
        unit: 'kgCO2e',
        verified: true
      }
    }
  };

  // 3. Sign the credential to make it "Verifiable" [cite: 605, 607]
  const verifiableCredential = await vc.issue({
    credential,
    suite,
    documentLoader,
  });
  
  // 4. Create an Audit Anchor (Hash) for the ledger [cite: 129, 605]
  const anchorHash = crypto.createHash('sha256')
    .update(JSON.stringify(verifiableCredential))
    .digest('hex');

  return { verifiableCredential, anchorHash };
}