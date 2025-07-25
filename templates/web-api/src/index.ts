import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

await fastify.register(cors);

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.get('/{{kebabName}}s', async (request, reply) => {
  return { data: [], message: 'List {{name}}s' };
});

fastify.post('/{{kebabName}}s', async (request, reply) => {
  return { data: {}, message: '{{name}} created' };
});

fastify.get('/{{kebabName}}s/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  return { data: { id }, message: `{{name}} ${id}` };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();