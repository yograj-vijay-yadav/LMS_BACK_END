import { retrieveRelevantDocuments } from './retriever.js';
import { generateRagAnswer } from './generator.js';

export const runRagPipeline = async (query) => {
  const retrievedDocs = await retrieveRelevantDocuments(query, 4);
  const answer = await generateRagAnswer({ query, retrievedDocs });

  return {
    answer,
    sources: retrievedDocs.map((doc) => ({
      id: doc.id,
      score: doc.score,
      type: doc.metadata?.type,
      title: doc.metadata?.title
    }))
  };
};
