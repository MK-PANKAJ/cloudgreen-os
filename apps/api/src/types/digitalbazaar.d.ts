declare module '@digitalbazaar/ed25519-verification-key-2020' {
  export class Ed25519VerificationKey2020 {
    static generate(options?: Record<string, unknown>): Promise<any>;
  }
}

declare module '@digitalbazaar/ed25519-signature-2020' {
  export class Ed25519Signature2020 {
    constructor(options?: Record<string, unknown>);
  }

  export const suiteContext: {
    constants: {
      CONTEXT_URL: string;
    };
    contexts: Map<string, unknown>;
  };
}

declare module '@digitalbazaar/credentials-context' {
  export const contexts: Map<string, unknown>;
}

declare module '@digitalbazaar/security-context' {
  const securityContext: {
    SECURITY_CONTEXT_V2_URL: string;
    contexts: Map<string, unknown>;
  };

  export default securityContext;
}

declare module '@digitalbazaar/vc' {
  export function defaultDocumentLoader(url: string): Promise<{
    contextUrl: string | null;
    documentUrl: string;
    document: unknown;
  }>;

  export function issue(options: {
    credential: Record<string, unknown>;
    suite: unknown;
    documentLoader?: (url: string) => Promise<{
      contextUrl: string | null;
      documentUrl: string;
      document: unknown;
    }>;
  }): Promise<any>;
}
