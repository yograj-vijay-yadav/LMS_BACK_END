import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'lms-rag-index';
const NAME_SPACE = process.env.PINECONE_NAMESPACE || 'lms-content';

/**
 * Static LMS knowledge base for RAG.
 * In production this can be replaced with CMS/database reads.
 */
const LMS_DATA = {
  courses: [
    {
      id: 'course-fullstack-web-dev',
      title: 'Full Stack Web Development',
      level: 'Beginner to Advanced',
      details:
        'Covers HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, authentication, deployment, and capstone projects.'
    },
    {
      id: 'course-data-structures-algorithms',
      title: 'Data Structures and Algorithms',
      level: 'Intermediate',
      details:
        'Focuses on arrays, linked lists, trees, graphs, recursion, dynamic programming, and interview-focused problem solving.'
    },
    {
      id: 'course-devops-cloud',
      title: 'DevOps and Cloud Fundamentals',
      level: 'Intermediate',
      details:
        'Includes Docker, CI/CD pipelines, Linux fundamentals, infrastructure basics, and cloud deployment workflows.'
    }
  ],
  pricing: {
    model: 'single-subscription',
    details:
      'The LMS uses one subscription plan that unlocks access to all courses, including current and newly added content.',
    billingOptions: ['monthly', 'yearly']
  },
  faqs: [
    {
      question: 'Do I get access to all courses with one plan?',
      answer: 'Yes. A single subscription provides access to all LMS courses.'
    },
    {
      question: 'Are new courses included in my subscription?',
      answer: 'Yes. New courses are included at no additional cost while your subscription is active.'
    },
    {
      question: 'Do courses include certificates?',
      answer: 'Yes. Eligible courses provide completion certificates after meeting requirements.'
    }
  ]
};

const getEmbeddingsModel = () =>
  new HuggingFaceTransformersEmbeddings({
    model: 'sentence-transformers/all-MiniLM-L6-v2'
  });

const getPineconeIndex = async () => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone.index(INDEX_NAME);
};

const toDocuments = () => {
  const documents = [];

  LMS_DATA.courses.forEach((course) => {
    documents.push(
      new Document({
        pageContent: `Course: ${course.title}\nLevel: ${course.level}\nDetails: ${course.details}`,
        metadata: {
          type: 'course',
          sourceId: course.id,
          title: course.title
        }
      })
    );
  });

  documents.push(
    new Document({
      pageContent: `Pricing Model: ${LMS_DATA.pricing.model}\nDetails: ${LMS_DATA.pricing.details}\nBilling options: ${LMS_DATA.pricing.billingOptions.join(', ')}`,
      metadata: {
        type: 'pricing',
        sourceId: 'pricing-single-subscription',
        title: 'LMS Pricing'
      }
    })
  );

  LMS_DATA.faqs.forEach((faq, index) => {
    documents.push(
      new Document({
        pageContent: `FAQ\nQ: ${faq.question}\nA: ${faq.answer}`,
        metadata: {
          type: 'faq',
          sourceId: `faq-${index + 1}`,
          title: faq.question
        }
      })
    );
  });

  return documents;
};

export const ingestLmsData = async () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('Missing PINECONE_API_KEY in environment variables.');
  }

  const sourceDocs = toDocuments();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 120
  });

  const chunks = await splitter.splitDocuments(sourceDocs);
  const embeddings = getEmbeddingsModel();
  const index = await getPineconeIndex();

  const vectors = await Promise.all(
    chunks.map(async (doc, idx) => {
      const values = await embeddings.embedQuery(doc.pageContent);

      return {
        id: `${doc.metadata.sourceId}-chunk-${idx + 1}`,
        values,
        metadata: {
          ...doc.metadata,
          text: doc.pageContent
        }
      };
    })
  );

  await index.namespace(NAME_SPACE).upsert(vectors);

  return {
    message: 'Ingestion completed successfully.',
    totalSourceDocuments: sourceDocs.length,
    totalChunks: chunks.length,
    namespace: NAME_SPACE,
    indexName: INDEX_NAME
  };
};