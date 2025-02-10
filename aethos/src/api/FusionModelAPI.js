const callFusionModel = async (input) => {
	const maxRetries = 5;
	let attempt = 0;
	let delay = 1000; // Start with 1 second delay

	while (attempt < maxRetries) {
		try {
			console.log(`Attempt ${attempt + 1} of ${maxRetries}`);

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
						stream: false,
						max_tokens: 1000,
					}),
				}
			);

			const data = await response.json();

			// If we get a rate limit error either in response status or data
			if (response.status === 429 || (data.error && data.error.code === 429)) {
				console.log(`Rate limit hit, waiting ${delay/1000} seconds before retry...`);
				await new Promise(resolve => setTimeout(resolve, delay));
				delay *= 2; // Double the delay for next attempt
				attempt++;
				continue;
			}

			// For other types of errors
			if (!response.ok || data.error) {
				throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
			}

			// Check for valid response structure
			if (data.choices && data.choices[0] && data.choices[0].message) {
				return data.choices[0].message.content;
			}

			throw new Error('Invalid response structure from API');

		} catch (error) {
			if (attempt === maxRetries - 1) {
				// If this was our last attempt, throw the error
				throw new Error(`Failed to get response after ${maxRetries} attempts: ${error.message}`);
			}
			
			// Otherwise, wait and try again
			console.log(`Error on attempt ${attempt + 1}, retrying...`);
			await new Promise(resolve => setTimeout(resolve, delay));
			delay *= 2;
			attempt++;
		}
	}

	throw new Error('Max retries reached without successful response');
};

export default callFusionModel;