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

/**
 * Convert course data to documents for ingestion
 */
const courseToDocument = (course) => {
  const content = `
Course: ${course.title}
Category: ${course.category}
Instructor: ${course.createdBy}
Description: ${course.description}
Number of Lectures: ${course.numberOfLectures}
${course.lectures && course.lectures.length > 0 ? `Lectures: ${course.lectures.map(l => `${l.title} - ${l.description}`).join('; ')}` : 'No lectures yet'}
  `.trim();

  return new Document({
    pageContent: content,
    metadata: {
      type: 'course',
      courseId: course._id.toString(),
      title: course.title,
      category: course.category
    }
  });
};

/**
 * Create embeddings and vectors from documents
 */
const createVectors = async (documents) => {
  if (!documents.length) return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  const chunks = await splitter.splitDocuments(documents);
  if (!chunks.length) return [];

  const texts = chunks.map(c => c.pageContent);
  const embeddings = getEmbeddingsModel();
  const allEmbeddings = await embeddings.embedDocuments(texts);

  const vectors = chunks.map((chunk, i) => ({
    id: `${chunk.metadata.courseId}-chunk-${i}-${Date.now()}`,
    values: allEmbeddings[i],
    metadata: {
      text: chunk.pageContent,
      type: chunk.metadata?.type || "course",
      courseId: chunk.metadata?.courseId,
      title: chunk.metadata?.title,
      category: chunk.metadata?.category
    }
  }));

  return vectors;
};

/**
 * Upsert vectors to Pinecone
 */
const upsertVectors = async (vectors) => {
  if (!vectors.length) return { success: true, count: 0 };

  const index = await getPineconeIndex();
  const response = await index.upsert({
    records: vectors
  });

  console.log(`Ingested ${vectors.length} vectors to Pinecone`);
  return { success: true, count: vectors.length };
};

/**
 * Delete vectors from Pinecone by courseId
 */
const deleteVectorsByCourseId = async (courseId) => {
  try {
    const index = await getPineconeIndex();
    
    // Query to find all vectors with this courseId
    const results = await index.query({
      topK: 10000,
      vector: new Array(384).fill(0),
      filter: { courseId: { $eq: courseId } },
      includeMetadata: true
    });

    // Delete vectors
    if (results.matches && results.matches.length > 0) {
      const ids = results.matches.map(m => m.id);
      await index.deleteMany(ids);
      console.log(`Deleted ${ids.length} vectors for courseId: ${courseId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting vectors:", error);
    return { success: false, error };
  }
};

/**
 * EVENT: Create Course - Ingest new course
 */
export const onCourseCreated = async (course) => {
  try {
    console.log(`Event: Course Created - ${course.title}`);
    const doc = courseToDocument(course);
    const vectors = await createVectors([doc]);
    await upsertVectors(vectors);
  } catch (error) {
    console.error("Error in onCourseCreated:", error);
  }
};

/**
 * EVENT: Add Lecture - Re-ingest course with updated lectures
 */
export const onLectureAdded = async (course) => {
  try {
    console.log(`Event: Lecture Added - ${course.title}`);
    // Delete old vectors for this course
    await deleteVectorsByCourseId(course._id.toString());
    // Re-ingest with updated data
    const doc = courseToDocument(course);
    const vectors = await createVectors([doc]);
    await upsertVectors(vectors);
  } catch (error) {
    console.error("Error in onLectureAdded:", error);
  }
};

/**
 * EVENT: Delete Lecture - Re-ingest course with updated lectures
 */
export const onLectureDeleted = async (course) => {
  try {
    console.log(`Event: Lecture Deleted - ${course.title}`);
    // Delete old vectors for this course
    await deleteVectorsByCourseId(course._id.toString());
    // Re-ingest with updated data
    const doc = courseToDocument(course);
    const vectors = await createVectors([doc]);
    await upsertVectors(vectors);
  } catch (error) {
    console.error("Error in onLectureDeleted:", error);
  }
};

/**
 * EVENT: Delete Course - Remove from Pinecone
 */
export const onCourseDeleted = async (courseId) => {
  try {
    console.log(`Event: Course Deleted - ${courseId}`);
    await deleteVectorsByCourseId(courseId);
  } catch (error) {
    console.error("Error in onCourseDeleted:", error);
  }
};

/**
 * EVENT: Update Course - Re-ingest with updated data
 */
export const onCourseUpdated = async (course) => {
  try {
    console.log(`Event: Course Updated - ${course.title}`);
    // Delete old vectors for this course
    await deleteVectorsByCourseId(course._id.toString());
    // Re-ingest with updated data
    const doc = courseToDocument(course);
    const vectors = await createVectors([doc]);
    await upsertVectors(vectors);
  } catch (error) {
    console.error("Error in onCourseUpdated:", error);
  }
};
