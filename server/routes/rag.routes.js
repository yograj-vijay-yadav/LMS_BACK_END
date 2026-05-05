import { Router } from 'express';
import { runRagPipeline } from '../rag/pipeline.js';
import { ingestLmsData } from '../rag/ingest.js';

const router = Router();

router.post('/ask', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required and must be a string.' });
    }

    const result = await runRagPipeline(query);
    return res.status(200).json({ answer: result.answer });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to process RAG query.' });
  }
});

router.post('/ingest', async (_req, res) => {
  try {
    const result = await ingestLmsData();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to ingest LMS data.' });
  }
});

export default router;