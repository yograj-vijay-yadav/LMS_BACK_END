import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

dotenv.config();

const getLlm = () =>
  new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama3-8b-8192',
    temperature: 0.2
  });

export const generateRagAnswer = async ({ query, retrievedDocs }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
  }

  const context = retrievedDocs.length
    ? retrievedDocs.map((doc, idx) => `[${idx + 1}] ${doc.text}`).join('\n\n')
    : 'No context retrieved.';

  const prompt = `You are an LMS assistant. Answer only using provided context.\nIf context is insufficient, clearly say you are unsure.\nKeep answers concise and helpful.\n\nUser question:\n${query}\n\nRetrieved context:\n${context}`;

  const response = await getLlm().invoke(prompt);
  return response?.content?.toString()?.trim() || 'Sorry, I could not generate an answer.';
};