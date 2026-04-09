import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import { getEstimatedCarbonIntensity, publishCarbonSignal } from './carbon.js';
import { issueCarbonCredential } from './vc.js';
import { generateGreenOpsRecommendation } from './ai.js';
import { getQueueMetrics } from './scheduler.js';
import { seedSupplyChainGraph, calculateScope3Exposure } from './graph.js';
import { rewardSupplier } from './blockchain.js';
import { verifyEmissionProof } from './zk.js';
import { yoga } from './graphql.js';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

// Register JWT plugin - using secret for token verification
// For Keycloak, you would typically use the public key or implement JWKS validation
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

fastify.get('/', async () => {
  return {
    service: 'cloudgreen-os-api',
    status: 'ok',
    endpoints: ['/health', '/api/carbon/live', '/api/credentials/issue'],
  };
});

fastify.get('/health', async () => {
  return { status: 'CloudGreen OS API is running', timestamp: new Date().toISOString() };
});

fastify.get('/api/carbon/live', async (request, reply) => {
  try {
    const data = await getEstimatedCarbonIntensity(52.52, 13.41);

    // Publish to Kafka (with retry/acks=-1 for reliability)
    // In background: don't block the response but ensure reliability
    publishCarbonSignal(data).catch((error) => {
      request.log.warn({ err: error }, 'Warning: Carbon signal failed to publish to Kafka');
    });

    return { success: true, message: 'Carbon signal computed', data };
  } catch (error) {
    request.log.error({ err: error }, 'Live carbon API request failed');
    return reply.status(503).send({
      success: false,
      error: error instanceof Error ? error.message : 'Live carbon API unavailable',
    });
  }
});

fastify.post('/api/credentials/issue', async (request, reply) => {
  const { supplierId, emissions } = request.body as { supplierId?: string; emissions?: number };

  if (!supplierId || emissions === undefined || emissions === null) {
    return reply.status(400).send({ error: 'Missing supplierId or emissions' });
  }

  const result = await issueCarbonCredential(supplierId, emissions);

  return {
    success: true,
    message: 'Verifiable Credential issued and anchored',
    ...result,
  };
});

fastify.post('/api/greenops/analyze', async (request, reply) => {
  const { code } = request.body as { code: string };
  if (!code) {
    return reply.status(400).send({ error: 'Missing code' });
  }

  const result = await generateGreenOpsRecommendation(code);
  return { success: true, ...result };
});

// New endpoint to fetch real-time queue statistics
fastify.get('/api/workloads/stats', async (request, reply) => {
  try {
    const stats = await getQueueMetrics();
    return {
      success: true,
      stats,
    };
  } catch (error) {
    request.log.error({ err: error }, 'Failed to fetch queue metrics');
    return reply.status(503).send({
      success: false,
      error: 'Queue metrics unavailable',
    });
  }
});

// New Supply Chain Exposure Endpoint
fastify.get('/api/enterprise/scope3', async (request, reply) => {
  try {
    const exposure = await calculateScope3Exposure();
    return { 
      success: true, 
      exposure 
    };
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Failed to query supply chain graph' });
  }
});

// Protected endpoint that requires JWT token
fastify.get(
  '/api/enterprise/scope3-protected',
  async (request, reply) => {
    try {
      await request.jwtVerify();
      const exposure = await calculateScope3Exposure();
      return { success: true, exposure };
    } catch (error) {
      reply.status(401).send({ error: 'Unauthorized', details: error instanceof Error ? error.message : 'Token verification failed' });
    }
  }
);

const start = async () => {
  try {
    await seedSupplyChainGraph();
    await fastify.listen({ port: 8787, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

fastify.post('/api/zk/verify', async (request, reply) => {
  // We now expect a walletAddress in the payload
  const { proof, publicSignals, supplierId, walletAddress } = request.body as any;

  if (!proof || !publicSignals || !walletAddress) {
    return reply.status(400).send({ error: 'Missing proof, publicSignals, or walletAddress payload' });
  }

  // Verify the ZK proof mathematically
  const isValid = await verifyEmissionProof(proof, publicSignals);

  if (isValid) {
    // 🎉 PROOF PASSED! Trigger the Web3 Token Mint!
    // We reward them with 100 GCRD for staying under the emission threshold
    const txHash = await rewardSupplier(walletAddress, 100);

    return { 
      success: true, 
      message: `ZK Proof verified successfully for ${supplierId}.`,
      reward: {
        tokens: 100,
        currency: 'GCRD',
        transactionHash: txHash
      }
    };
  } else {
    return reply.status(400).send({ 
      success: false, 
      message: 'Invalid ZK Proof. Verification failed.' 
    });
  }
});

// Expose the Unified GraphQL Hub
fastify.route({
  url: '/graphql',
  method: ['GET', 'POST', 'OPTIONS'],
  handler: async (req, reply) => {
    const response = await yoga.handleNodeRequest(req);
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });
    reply.status(response.status);
    reply.send(response.body);
    return reply;
  },
});

start();