import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getEstimatedCarbonIntensity, publishCarbonSignal } from './carbon.js';
import { issueCarbonCredential } from './vc.js';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: true });

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

fastify.get('/api/carbon/live', async (request) => {
  const data = await getEstimatedCarbonIntensity(52.52, 13.41);

  try {
    await publishCarbonSignal(data);
    return { success: true, message: 'Carbon signal processed and published', data, kafkaPublished: true };
  } catch (error) {
    request.log.error({ err: error }, 'Failed to publish carbon signal to Kafka');
    return { success: true, message: 'Carbon signal computed but Kafka publish failed', data, kafkaPublished: false };
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

const start = async () => {
  try {
    await fastify.listen({ port: 8787, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();