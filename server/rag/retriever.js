import { Pinecone } from '@pinecone-database/pinecone';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import dotenv from 'dotenv';

dotenv.config();

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lms-rag-index';

const getPineconeIndex = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(INDEX_NAME);  
};

const getEmbeddingsModel = () =>
  new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2"
  });

export const retrieveRelevantDocuments = async (query, topK = 4) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string.');
  }

  const embeddings = getEmbeddingsModel();
  const queryEmbedding = await embeddings.embedQuery(query);
  const index = await getPineconeIndex();

  const result = await index.query({
    vector: Array.from(queryEmbedding),
    topK,
    includeMetadata: true
  });

  return (result.matches || []).map(match => ({
    id: match.id,
    score: match.score,
    text: match.metadata?.text || '',
    metadata: match.metadata || {}
  }));
};