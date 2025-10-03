export interface OllamaAnalysis {
  summary?: string;
  classification?: string;
  extractedData?: Record<string, any>;
  sentiment?: string;
  keywords?: string[];
}

export async function analyzeWithOllama(
  content: string,
  task: 'summarize' | 'classify' | 'extract' | 'sentiment',
  customPrompt?: string
): Promise<OllamaAnalysis> {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  
  try {
    let prompt = '';
    
    switch (task) {
      case 'summarize':
        prompt = customPrompt || `Summarize the following content in 2-3 sentences:\n\n${content.substring(0, 3000)}`;
        break;
      
      case 'classify':
        prompt = customPrompt || `Classify this web page into ONE category (product, article, blog, news, homepage, contact, about, or other). Respond with only the category name:\n\n${content.substring(0, 2000)}`;
        break;
      
      case 'extract':
        prompt = customPrompt || `Extract key information from this content as JSON with fields: title, main_topic, key_points (array), entities (people, organizations, locations):\n\n${content.substring(0, 3000)}`;
        break;
      
      case 'sentiment':
        prompt = customPrompt || `Analyze the sentiment of this content. Respond with only one word: positive, negative, or neutral:\n\n${content.substring(0, 2000)}`;
        break;
    }

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama API request failed');
    }

    const data = await response.json();
    const result: OllamaAnalysis = {};

    switch (task) {
      case 'summarize':
        result.summary = data.response.trim();
        break;
      
      case 'classify':
        result.classification = data.response.trim().toLowerCase();
        break;
      
      case 'extract':
        try {
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result.extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch {
          result.extractedData = { raw: data.response };
        }
        break;
      
      case 'sentiment':
        result.sentiment = data.response.trim().toLowerCase();
        break;
    }

    return result;
  } catch (error: any) {
    console.error('Ollama analysis error:', error);
    return { summary: 'Analysis failed' };
  }
}

export async function classifyPage(bodyText: string, title: string): Promise<string> {
  const analysis = await analyzeWithOllama(
    `Title: ${title}\n\nContent: ${bodyText}`,
    'classify'
  );
  return analysis.classification || 'unknown';
}

export async function extractStructuredData(bodyText: string, extractionPrompt: string): Promise<Record<string, any>> {
  const analysis = await analyzeWithOllama(bodyText, 'extract', extractionPrompt);
  return analysis.extractedData || {};
}
