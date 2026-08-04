import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import AppError from '../utils/appError.js';
import { getCache, setCache, makeKey } from '../utils/redisCache.js';

/**
 * Simulated RAG pipeline.
 * For real-world usage replace generateAnswer with calls to embedding, vector DB search,
 * and an LLM. This example keeps things synchronous and deterministic so tests
 * and offline development work without external AI dependencies.
 */
async function generateAnswer(question) {
  // Placeholder: pretend to run retrieval + generation pipeline
  // Add a small async delay to mimic processing time
  await new Promise((r) => setTimeout(r, 200));
  return `Generated answer for: ${question}`;
}

// POST /api/rag/ask
export const askRag = asyncHandler(async (req, res, next) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return next(new AppError('question is required in request body', 400));
  }

  // Build a compact cache key for the question using SHA1 hash
  const cacheKey = makeKey('rag', question);

  // 1) Try Redis first
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, cached: true, answer: cached });
  }

  // 2) Miss -> run the RAG pipeline (simulated here)
  const answer = await generateAnswer(question);

  // 3) Store the generated answer in Redis with TTL 1 hour (3600 seconds)
  await setCache(cacheKey, answer, 60 * 60);

  // 4) Return the generated answer
  res.status(200).json({ success: true, cached: false, answer });
});
