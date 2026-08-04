import { Router } from 'express';
import { runRagPipeline } from '../rag/pipeline.js';
import { getCache, setCache, makeKey } from '../utils/redisCache.js';

const router = Router();

// POST /api/rag/ask
// Flow:
// - Check Redis first; if hit return cached answer
// - Otherwise run existing RAG pipeline, store the answer in Redis (TTL 1 hour), return answer
router.post('/ask', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required and must be a string.' });
    }

    // Build a compact cache key for the query
    const cacheKey = makeKey('rag', query);

    // Try Redis first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ answer: cached, cached: true });
    }

    // Miss -> run pipeline
    const result = await runRagPipeline(query);

    // Store the answer in Redis (TTL: 1 hour)
    try {
      // store the answer string (result.answer) in cache
      await setCache(cacheKey, result.answer, 60 * 60);
    } catch (err) {
      console.error('Failed to set RAG cache:', err.message || err);
    }

    return res.status(200).json({ answer: result.answer, cached: false, sources: result.sources });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to process RAG query.' });
  }
});

export default router;