const callGeminiModel = async (input) => {
	try {
		const response = await fetch(
			import.meta.env.VITE_OPENROUTER_API_URL + '/chat/completions',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`,
					'HTTP-Referer': window.location.href,
					'X-Title': 'Mizuka Chat',
				},
				body: JSON.stringify({
					model: 'google/gemini-2.0-pro-exp-02-05:free',
					messages: [
						{
							role: 'user',
							content: input,
						},
					],
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data.choices[0].message.content;
	} catch (error) {
		console.error('Gemini API Error:', error);
		throw new Error('Failed to get response from Gemini');
	}
};

export default callGeminiModel; 