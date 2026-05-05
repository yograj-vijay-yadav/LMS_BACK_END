import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lms-rag-index';
const NAME_SPACE = process.env.PINECONE_NAMESPACE || 'lms-content';

// ✅ Embeddings
const getEmbeddingsModel = () =>
  new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2"
  });

// ✅ Pinecone
const getPineconeIndex = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(INDEX_NAME);
};

// ✅ Sample LMS data
const toDocuments = () => {
  return [
    new Document({ pageContent: "Full Stack Web Development course with React, Node, MongoDB", metadata: { type: "course" }}),
    new Document({ pageContent: "DSA covers arrays, trees, graphs", metadata: { type: "course" }}),
    new Document({ pageContent: "DevOps includes Docker and CI/CD", metadata: { type: "course" }}),
    new Document({ pageContent: "Single subscription gives access to all courses", metadata: { type: "pricing" }}),
    new Document({ pageContent: "Yes, all courses included", metadata: { type: "faq" }}),
    new Document({ pageContent: "Certificates are provided", metadata: { type: "faq" }})
  ];
};

export const ingestLmsData = async () => {
  const docs = toDocuments();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  const chunks = await splitter.splitDocuments(docs);

  if (!chunks.length) throw new Error("No chunks created");

  const texts = chunks.map(c => c.pageContent);

  const embeddings = getEmbeddingsModel();

  console.log("Docs:", docs.length);
  console.log("Chunks:", chunks.length);
  console.log("Texts:", texts.length);

  // ✅ SINGLE embedding call (fast)
  const allEmbeddings = await embeddings.embedDocuments(texts);

  console.log("Embeddings:", allEmbeddings.length);

  const vectors = chunks.map((doc, idx) => {
    const embedding = allEmbeddings[idx];

    if (!embedding || !embedding.length) {
      throw new Error(`Invalid embedding at index ${idx}`);
    }

    return {
      id: `doc-${idx}-${Date.now()}`,
      values: Array.from(embedding),
      metadata: {
        ...doc.metadata,
        text: doc.pageContent
      }
    };
  });

  console.log("Vectors:", vectors.length);
  console.log("Sample vector ID:", vectors[0]?.id);

  if (!vectors.length) throw new Error("No vectors created");

  const index = await getPineconeIndex();

  try {
    console.log("Sending to Pinecone...");
    
    // ✅ FIXED: Remove the {vectors} wrapper, just pass vectors
    const response = await index.upsert(vectors);

    console.log("✅ Pinecone success:", response);

  } catch (err) {
    console.error("❌ Pinecone FULL ERROR:", err);
    throw err;
  }

  console.log("✅ Ingestion done");

  return {
    success: true,
    count: vectors.length
  };
};