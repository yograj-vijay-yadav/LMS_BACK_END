import OpenAI from 'openai';

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

class EmbeddingService {
  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async embedText(input) {
    if (!input || !input.trim()) return [];

    const response = await this.client.embeddings.create({ model: EMBEDDING_MODEL, input });
    return response.data[0]?.embedding || [];
  }

  async embedBatch(texts = []) {
    if (!Array.isArray(texts) || texts.length === 0) return [];

    const response = await this.client.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
    return response.data.map((item) => item.embedding);
  }
}

export default new EmbeddingService();