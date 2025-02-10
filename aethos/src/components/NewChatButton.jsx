import { PlusCircle } from 'lucide-react';
import React from 'react';

const NewChatButton = ({ clearHistory, messages }) => {
	const startNewChat = () => {
		if (messages.length > 0) {
			const currentTime = new Date();
			const chatSession = {
				id: Date.now(),
				messages: messages,
				timestamp: currentTime.toISOString(),
				title: messages[0]?.text.substring(0, 30) + '...' || 'New Chat',
			};

			const existingChats = JSON.parse(
				localStorage.getItem('chatSessions') || '[]'
			);

			const updatedChats = [chatSession, ...existingChats];
			const limitedChats = updatedChats.slice(0, 10);
			localStorage.setItem('chatSessions', JSON.stringify(limitedChats));
		}

		clearHistory(); // Clear current messages
	};

	return (
		<button
			onClick={startNewChat}
			className='new-chat-btn'
			data-tooltip='Start New Chat'
			aria-label='Start New Chat'
		>
			<PlusCircle size={18} />
		</button>
	);
};

export default NewChatButton; 