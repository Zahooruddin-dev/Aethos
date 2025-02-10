const callFusionModel = async (input) => {
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
					model: 'qwen/qwen2.5-vl-72b-instruct:free', // Using Claude for enhancement
					messages: [
						{
							role: 'system',
							content:
								'You are an AI assistant that improves and fact-checks responses. Review the following response and enhance it with additional information, corrections, or clarifications where necessary.',
						},
						{
							role: 'user',
							content: `Please review and enhance this response: ${input}`,
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
		console.error('Fusion API Error:', error);
		throw new Error('Failed to get response from Fusion');
	}
};

export default callFusionModel; 