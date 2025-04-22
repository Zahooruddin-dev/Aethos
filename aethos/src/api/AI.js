// Store sessions in a map with their message histories
let sessions = new Map();
let currentSessionId = null;

const createNewSession = () => {
    const sessionId = Date.now().toString();
    sessions.set(sessionId, [{
        role: 'system',
        content: 'You are an AI named Mizuka, a helpful and friendly assistant. Maintain context of the conversation and provide relevant responses based on the chat history.'
    }]);
    return sessionId;
};

export const switchSession = (sessionId) => {
    if (!sessions.has(sessionId)) {
        return createNewSession();
    }
    currentSessionId = sessionId;
    return sessionId;
};

export const getCurrentSession = () => {
    if (!currentSessionId || !sessions.has(currentSessionId)) {
        currentSessionId = createNewSession();
    }
    return sessions.get(currentSessionId);
};

const callAI = async (prompt) => {
    try {
        const messageHistory = getCurrentSession();
        messageHistory.push({
            role: 'user',
            content: prompt,
        });

        const response = await fetch(
            import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Aethos Chat',
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: messageHistory, // Use entire message history
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response format from API');
        }

        // Add AI's response to history
        messageHistory.push(data.choices[0].message);

        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw new Error('Failed to get AI response');
    }
};

export const clearConversation = () => {
    if (currentSessionId) {
        sessions.set(currentSessionId, [{
            role: 'system',
            content: 'You are an AI named Mizuka, a helpful and friendly assistant. Maintain context of the conversation and provide relevant responses based on the chat history.'
        }]);
    }
};

export const getAllSessions = () => {
    return Array.from(sessions.entries()).map(([id, messages]) => ({
        id,
        messages,
        preview: messages.length > 1 ? messages[1].content : 'Empty conversation'
    }));
};

export const MODEL_NAME = 'nvidia/llama-3.1-nemotron-nano-8b-v1:free';

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

export default callAI;
