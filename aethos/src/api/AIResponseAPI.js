import callFusionModel from './FusionModelAPI'; // Import the callFusionModel function

const getAIResponse = async (input, abortController = null) => {
	try {
		console.log('Sending request with input:', input);

		const response = await callFusionModel(input);

		if (!response) {
			throw new Error('Invalid response format');
		}

		return response;
	} catch (error) {
		if (error.name === 'AbortError') {
			console.log('Fetch aborted');
			throw new Error('Request was cancelled');
		} else {
			console.error('Detailed AI Response error:', {
				name: error.name,
				message: error.message,
				stack: error.stack
			});
			throw new Error(`Failed to get AI response: ${error.message}`);
		}
	}
};

export default getAIResponse; 