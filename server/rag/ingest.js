import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lms';

const getEmbeddingsModel = () =>
  new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HF_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2"
  });

const getPineconeIndex = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(
    INDEX_NAME,
    "https://lms-8g84wlf.svc.aped-4627-b74a.pinecone.io"
  );
};

const runCheck = async () => {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

    // List all indexes
    const indexes = await pinecone.listIndexes();
    console.log("Available indexes:", indexes);

    if (!indexes.includes("lms")) {
      console.error("❌ Index 'lms' not found. You may need to create it.");
      return;
    }

    // Connect to your index
    const index = pinecone.index("lms");

    // Describe stats
    const stats = await index.describeIndexStats();
    console.log("Index stats:", JSON.stringify(stats, null, 2));

    // Check dimension
    if (stats.dimension !== 384) {
      console.error(`❌ Dimension mismatch. Index dimension is ${stats.dimension}, but your embeddings are 384.`);
    } else {
      console.log("✅ Dimension matches (384).");
    }
  } catch (err) {
    console.error("Error checking Pinecone:", err);
  }
};



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
  runCheck();
  console.log("Starting ingestion...");
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

  const allEmbeddings = await embeddings.embedDocuments(texts);

  console.log("Embeddings:", allEmbeddings.length);

  // Map over chunks to align with embeddings
 const vectors = chunks.map((chunk, i) => ({
  id: `chunk-${i}-${Date.now()}`,
  values: allEmbeddings[i],
  metadata: {
    text: chunk.pageContent,
    type: chunk.metadata?.type || "unknown"
    // ❌ remove loc or convert to string
    // loc: JSON.stringify(chunk.metadata?.loc) // optional if you want to keep it
  }
}));


  console.log("Vectors:", vectors.length);
  console.log("Sample vector:", vectors[0]);

  if (!vectors.length) throw new Error("No vectors created");

  const index = await getPineconeIndex();

  try {
    console.log("Sending to Pinecone...");
    
    // ✅ Correct format: wrap in { vectors }
    const response = await index.upsert({
  records: vectors
});


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
