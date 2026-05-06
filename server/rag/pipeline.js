import { retrieveRelevantDocuments } from './retriever.js';
import { generateRagAnswer } from './generator.js';

export const runRagPipeline = async (query) => {
  console.log("Running RAG pipeline for query:", query);
  const retrievedDocs = await retrieveRelevantDocuments(query, 4);
  console.log("Retrieved docs:", retrievedDocs.length);
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
