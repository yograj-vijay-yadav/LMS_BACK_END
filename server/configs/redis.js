import { createClient } from 'redis';

// Create a Redis client using environment variables when available
// This file exports two things:
// - client: the Redis client instance
// - connectRedis: an async initializer that attempts to connect but does not throw

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const client = createClient({ url: redisUrl });

// Log Redis errors but do not crash the application
client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

let connected = false;

// Attempt to connect to Redis but don't let failures crash the app.
// Calling code should await this during startup but the function will
// catch connection errors and log them instead of rethrowing.
export async function connectRedis() {
  if (connected) return;

  try {
    await client.connect();
    connected = true;
    console.log('Connected to Redis');
  } catch (err) {
    // If connection fails, log and continue. The rest of the app will work
    // normally against MongoDB. Helpers check client.isOpen before using.
    console.error('Could not connect to Redis. Continuing without Redis. Error:', err.message || err);
  }
}

export default client;