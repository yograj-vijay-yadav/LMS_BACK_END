import { ChatGroq } from '@langchain/groq';
import dotenv from 'dotenv';

dotenv.config();

const getLlm = () =>
  new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2
  });

export const generateRagAnswer = async ({ query, retrievedDocs }) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
  }
  
  const context = retrievedDocs.length
    ? retrievedDocs.map((doc, idx) => `[${idx + 1}] ${doc.text}`).join('\n\n')
    : 'No context retrieved.';
  
  console.log("Generated context for LLM:", context);
  
  const prompt = `You are an LMS assistant. Answer only using provided context.\nIf context is insufficient, clearly say you are unsure.\nKeep answers concise and helpful.\n\nUser question:\n${query}\n\nRetrieved context:\n${context}`;
  
  console.log("Constructed prompt for LLM:", prompt);
  
  try {
    console.log("Calling Groq LLM...");
    const response = await getLlm().invoke(prompt);
    console.log("Groq response received:", response);
    return response?.content?.toString()?.trim() || 'Sorry, I could not generate an answer.';
  } catch (error) {
    console.error("Groq LLM Error:", error.message);
    console.error("Full error:", error);
    throw new Error(`Groq API failed: ${error.message}`);
  }
};