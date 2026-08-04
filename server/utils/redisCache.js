import client from '../configs/redis.js';
import crypto from 'crypto';

/**
 * Helper functions for interacting with Redis.
 * - getCache(key): returns parsed JSON value or null
 * - setCache(key, value, ttlSeconds): stores JSON value with TTL
 * - deleteCache(keyOrPattern): deletes a specific key or keys matching a pattern
 *
 * All functions are resilient: if Redis is unavailable they log the error
 * and return sensible defaults so the application continues to function.
 */

// Utility to safely check if redis client is available and connected
function redisAvailable() {
  try {
    return client && client.isOpen;
  } catch (err) {
    return false;
  }
}

// Create a short safe cache key from longer identifiers (optional usage)
export function makeKey(prefix, value) {
  // Hash the value when it might be long (e.g., user input)
  const h = crypto.createHash('sha1').update(String(value)).digest('hex');
  return `${prefix}:${h}`;
}

// Get cache by exact key. Returns parsed object or null on miss/error.
export async function getCache(key) {
  try {
    if (!redisAvailable()) return null;

    const reply = await client.get(key);
    if (!reply) return null;

    try {
      return JSON.parse(reply);
    } catch (err) {
      // If parsing fails, return raw string
      return reply;
    }
  } catch (err) {
    console.error('Redis get error for key', key, err.message || err);
    return null;
  }
}

// Set cache with TTL (seconds). Value is JSON-stringified.
export async function setCache(key, value, ttlSeconds = 600) {
  try {
    if (!redisAvailable()) return;

    const stringValue = JSON.stringify(value);
    // Use EX to set TTL in seconds
    await client.set(key, stringValue, { EX: ttlSeconds });
  } catch (err) {
    console.error('Redis set error for key', key, err.message || err);
  }
}

// Delete a single key or multiple keys matching a pattern (supports '*' wildcard)
export async function deleteCache(keyOrPattern) {
  try {
    if (!redisAvailable()) return;

    // If a pattern is provided (contains '*'), use SCAN iterator to find keys
    if (keyOrPattern.includes('*')) {
      const keysToDelete = [];
      // redis v4 supports scanIterator
      for await (const k of client.scanIterator({ MATCH: keyOrPattern })) {
        keysToDelete.push(k);
      }

      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
      }
    } else {
      // Exact key delete
      await client.del(keyOrPattern);
    }
  } catch (err) {
    console.error('Redis delete error for', keyOrPattern, err.message || err);
  }
}

// Export a helper to build the standard course keys used by the application
export function courseAllKey() {
  return 'courses:all';
}

export function courseKey(courseId) {
  return `courses:${courseId}`;
}