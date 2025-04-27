export const stopSearch = (
	abortController,
	stopResponseTimer,
	setIsLoading
) => {
	// Logic to stop the ongoing search
	if (abortController.current) {
		abortController.current.abort(); // Abort the fetch request
	}
	stopResponseTimer(); // Stop the response timer if applicable
	setIsLoading(false); // Set loading state to false
};
