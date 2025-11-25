
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, GroundingChunk } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const contentGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        longScript: {
            type: Type.STRING,
            description: "A script for an approximately 8-minute video. It must be direct, optimistic, and have an engaging introduction. It should be formatted for a text-to-speech AI (plain text paragraphs).",
        },
        shortScript: {
            type: Type.STRING,
            description: "A script for an approximately 1.5-minute video, in the same style as the long one.",
        },
        titles: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            },
            description: "An array of 10 creative and catchy title ideas for the video.",
        },
        description: {
            type: Type.STRING,
            description: "An SEO-optimized video description, including relevant keywords and a compelling summary.",
        },
        tags: {
            type: Type.STRING,
            description: "A single string containing 15 of the best tags for the topic, separated by commas.",
        },
    },
    required: ["longScript", "shortScript", "titles", "description", "tags"],
};

export const generateContent = async (inputText: string): Promise<{ content: GeneratedContent, citations: GroundingChunk[] }> => {
    try {
        const isShortInput = inputText.trim().split(/\s+/).length < 30;
        let topic: string;
        let finalPrompt: string;

        if (isShortInput) {
            // Input is likely a topic, title, or product name
            topic = inputText.trim();
        } else {
            // Input is a transcript, so we need to identify the topic first
            const transcript = inputText;
            const topicPrompt = `From the following video transcript, identify and return only the main subject or topic in 2-5 words. Transcript: "${transcript}"`;
            const topicModel = 'gemini-2.5-flash';
            const topicResponse = await ai.models.generateContent({ model: topicModel, contents: topicPrompt });
            topic = topicResponse.text.trim();
            if (!topic) {
                throw new Error("Could not identify a topic from the transcript.");
            }
        }

        // Now that we have a topic, get grounded information
        const groundingPrompt = `Gather interesting and up-to-date facts, statistics, and key information about "${topic}". Synthesize it into a brief, informative summary.`;
        const groundingResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: groundingPrompt,
            config: { tools: [{ googleSearch: {} }] },
        });

        const webInfo = groundingResponse.text;
        const citations = (groundingResponse.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
        
        // Construct the final prompt based on input type
        if (isShortInput) {
             finalPrompt = `
                Your task is to act as a professional YouTube content strategist.
                Based on the provided topic and supplementary web information, generate a complete content package for a new video.

                Topic:
                ---
                ${topic}
                ---

                Supplementary Web Information:
                ---
                ${webInfo}
                ---

                Generate all content in Portuguese (Brazil).

                Now, create the content package following the specified JSON schema. Ensure the tone is direct and optimistic, and the introductions are engaging to capture interest in the first few seconds. The scripts should be ready for a text-to-speech AI, so avoid scene directions or timestamps.
            `;
        } else {
            finalPrompt = `
                Your task is to act as a professional YouTube content strategist.
                Based on the original video transcript and supplementary web information, generate a complete content package for a new video.

                Original Transcript Summary:
                ---
                ${inputText.substring(0, 3000)}... 
                ---

                Supplementary Web Information on "${topic}":
                ---
                ${webInfo}
                ---

                Generate all content in Portuguese (Brazil).

                Now, create the content package following the specified JSON schema. Ensure the tone is direct and optimistic, and the introductions are engaging to capture interest in the first few seconds. The scripts should be ready for a text-to-speech AI, so avoid scene directions or timestamps.
            `;
        }

        // Generate the final content package
        const contentModel = 'gemini-2.5-pro';
        const response = await ai.models.generateContent({
            model: contentModel,
            contents: finalPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: contentGenerationSchema,
            },
        });

        const jsonStr = response.text.trim();
        const content: GeneratedContent = JSON.parse(jsonStr);

        return { content, citations };

    } catch (error) {
        console.error("Error generating content:", error);
        throw new Error("Failed to generate content from Gemini API. Please check the console for details.");
    }
};

export const refineContent = async (originalText: string, instruction: string): Promise<string> => {
    try {
        const prompt = `
            You are a professional video script editor.
            
            Original Script:
            ---
            ${originalText}
            ---
            
            User Instruction for Revision:
            "${instruction}"
            
            Task: Rewrite the script applying the user's instruction. Maintain the original tone unless asked otherwise. Keep the formatting suitable for text-to-speech (plain text paragraphs). Return ONLY the updated script text, no markdown code blocks or explanations.
            
            Language: Portuguese (Brazil).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text.trim();
    } catch (error) {
         console.error("Error refining text:", error);
        throw new Error("Failed to refine text.");
    }
};
