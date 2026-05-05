import { Pinecone } from '@pinecone-database/pinecone';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lms-rag-index';
const NAME_SPACE = process.env.PINECONE_NAMESPACE || 'lms-content';

const getPineconeIndex = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(INDEX_NAME);
};

const getEmbeddingsModel = () =>
  new HuggingFaceTransformersEmbeddings({
    model: 'sentence-transformers/all-MiniLM-L6-v2'
  });

export const retrieveRelevantDocuments = async (query, topK = 4) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string.');
  }

  if (!process.env.PINECONE_API_KEY) {
    throw new Error('Missing PINECONE_API_KEY in environment variables.');
  }

  const embeddings = getEmbeddingsModel();
  const queryEmbedding = await embeddings.embedQuery(query);

  const index = await getPineconeIndex();
  const result = await index.namespace(NAME_SPACE).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true
  });

  return (result.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    text: match.metadata?.text || '',
    metadata: match.metadata || {}
  }));
};