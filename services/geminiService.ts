
import { GoogleGenAI } from "@google/genai";
import { DiffResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. Gemini features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const formatDiffForPrompt = (diff: DiffResult): string => {
  let prompt = "Please summarize the following changes between two versions of a business process. Be concise and use bullet points for lists of elements.\n\n";

  if (diff.addedDetails.length > 0) {
    prompt += "**Added Elements:**\n";
    diff.addedDetails.forEach(el => {
      prompt += `* ${el.type}: "${el.name || el.id}"\n`;
    });
    prompt += "\n";
  }

  if (diff.removedDetails.length > 0) {
    prompt += "**Removed Elements:**\n";
    diff.removedDetails.forEach(el => {
      prompt += `* ${el.type}: "${el.name || el.id}"\n`;
    });
    prompt += "\n";
  }

  if (diff.modified.length > 0) {
    prompt += "**Modified Elements:**\n";
    diff.modified.forEach(mod => {
      prompt += `* ${mod.type} "${mod.name || mod.id}" was changed:\n`;
      mod.changes.forEach(change => {
        // We only show a few key properties to avoid noise
        if (['name', 'camunda:assignee', 'camunda:candidateUsers', 'camunda:candidateGroups', 'camunda:formKey', 'sourceRef', 'targetRef'].includes(change.property)) {
          prompt += `  - Property '${change.property}' changed from "${change.oldValue}" to "${change.newValue}"\n`;
        }
      });
    });
    prompt += "\n";
  }
  
  if (diff.addedDetails.length === 0 && diff.removedDetails.length === 0 && diff.modified.length === 0) {
      prompt += "There were no functional changes detected between the two process versions."
  }

  return prompt;
};

export const summarizeChanges = async (diffResult: DiffResult): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject(new Error("API key is not configured."));
  }

  const prompt = formatDiffForPrompt(diffResult);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert business process analyst. Your role is to provide a clear, high-level summary of the differences between two BPMN process diagrams. Focus on the business impact of the changes.",
        temperature: 0.3,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get summary from AI service.");
  }
};
