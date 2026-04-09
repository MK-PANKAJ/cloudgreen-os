import axios from 'axios';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';

// Real deterministic energy heuristic based on code complexity
export function calculateEnergyComplexity(code: string): number {
  const loopCount = (code.match(/for|while|map|forEach|reduce|filter/g) || []).length;
  const dbCalls = (code.match(/select|update|insert|delete|query/gi) || []).length;
  const stringLength = code.length;

  const baseEnergy = stringLength * 0.0005; 
  const loopPenalty = loopCount * 0.45;
  const ioPenalty = dbCalls * 0.85;

  return +(baseEnergy + loopPenalty + ioPenalty).toFixed(2);
}

export async function generateGreenOpsRecommendation(codeSnippet: string) {
  const exactEnergyEstimate = calculateEnergyComplexity(codeSnippet);
  
  const prompt = `
    You are the CloudGreen OS GreenOps Advisor.
    The following code snippet requires an estimated ${exactEnergyEstimate} kW of energy due to its cyclomatic complexity.
    Provide a very short, actionable recommendation to optimize this code.
    
    Code:
    ${codeSnippet}
  `;

  try {
    const response = await axios.post(OLLAMA_URL, {
      model: 'llama3.1:8b', 
      prompt: prompt,
      stream: false
    });

    return {
      recommendation: response.data.response,
      energy_kw: exactEnergyEstimate
    };
  } catch (error) {
    throw new Error("Failed to generate AI recommendation.");
  }
}