const translationCache = new Map(); // Keep the cache here

const translateText = async (text, targetLanguage) => {
	if (!text || typeof text !== 'string') return '';

	// Generate a unique cache key based on the target language and text.
	const cacheKey = `${targetLanguage}:${text}`;
	if (translationCache.has(cacheKey)) {
		return translationCache.get(cacheKey);
	}

	try {
		const response = await fetch(
			import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
					'HTTP-Referer': window.location.href,
					'X-Title': 'Mizuka Chat',
				},
				body: JSON.stringify({
					model: 'qwen/qwen2.5-vl-72b-instruct:free',
					messages: [
						{
							role: 'system',
							content: `You are a translation assistant. Translate the following text to ${targetLanguage}. Only respond with the translation, nothing else.`,
						},
						{
							role: 'user',
							content: text,
						},
					],
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.text();
			console.error('Translation API Error Response:', errorData);
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		// Check if the response format is valid
		if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
			console.error('Invalid response format from Translation API:', data);
			throw new Error('Invalid response format from Translation API');
		}

		const translatedText = data.choices[0].message.content;
		// Cache the successful translation for future calls.
		translationCache.set(cacheKey, translatedText);

		return translatedText;
	} catch (error) {
		console.error('Translation error:', error);
		// Fallback: return the original text if translation fails.
		return text;
	}
};

export default translateText; 