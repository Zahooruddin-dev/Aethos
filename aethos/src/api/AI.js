const callAI = async (prompt) => {
    try {
        const response = await fetch(import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Aethos Chat'
            },
            body: JSON.stringify({
              model:MODEL_NAME,
              messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw new Error('Failed to get AI response');
    }
};

export const translateText = async (text, targetLanguage) => {
	if (!text || typeof text !== 'string') return '';
	
	try {
			const translationPrompt = `Translate the following text to ${targetLanguage}. Only respond with the translation, nothing else: "${text}"`;
			const translatedText = await callAI(translationPrompt);
			return translatedText;
	} catch (error) {
			console.error('Translation error:', error);
			return text;
	}
};
export const MODEL_NAME = "nvidia/llama-3.1-nemotron-nano-8b-v1:free";

// Existing code...
export default callAI;