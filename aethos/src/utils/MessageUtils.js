export const pinMessage = (messageId, pinnedMessages, setPinnedMessages) => {
	setPinnedMessages((prev) => {
		if (prev.includes(messageId)) {
			return prev.filter((id) => id !== messageId); // Unpin if already pinned
		}
		if (prev.length >= 5) {
			return prev; // Don't add new pin if already at 5 messages
		}
		return [...prev, messageId]; // Pin the message
	});
}; 