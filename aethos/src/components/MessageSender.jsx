import React, { useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import callAI, { translateText } from '../api/AI.js';
import { languageOptions, useLanguage } from '../utils/LanguageOptions';
import VoiceInput from './VoiceInput';

const MessageSender = ({
	input,
	setInput,
	setMessages,
	setIsLoading,
	setError,
	startResponseTimer,
	stopResponseTimer,
	isLoading,
}) => {
	const [selectedPersonality, setSelectedPersonality] = useState('default');
	const { selectedLanguage, setSelectedLanguage } = useLanguage();

	const handlePersonalityChange = (e) => {
		setSelectedPersonality(e.target.value);
	};

	const handleSpeechResult = (transcript) => {
		setInput(transcript);
	};

	const handleSendMessage = async (e) => {
		e.preventDefault();
		console.log('handleSendMessage called'); // Debug log

		if (!input.trim() || isLoading) {
			console.log('Input empty or loading, returning'); // Debug log
			return;
		}

		try {
			setIsLoading(true);
			setError('');

			// Create user message
			const userMessage = {
				id: Date.now(),
				text: input,
				sender: 'user',
			};

			// Create loading message
			const loadingMessage = {
				id: Date.now() + 1,
				sender: 'ai',
				isLoading: true,
			};

			console.log('Adding messages:', { userMessage, loadingMessage }); // Debug log

			// Update messages with user message and loading message
			setMessages((prev) => [...prev, userMessage, loadingMessage]);
			setInput('');
			startResponseTimer();

			// Process input with translation if needed
			let processedInput = input;
			if (selectedLanguage !== 'en') {
				const translatedToEnglish = await translateText(input, 'English');
				processedInput = translatedToEnglish;
			}

			// Add personality context to the prompt
			let personalityContext = '';
			if (selectedPersonality === 'friendly') {
				personalityContext = 'Provide a friendly response: ';
			} else if (selectedPersonality === 'professional') {
				personalityContext = 'Provide a professional and formal response: ';
			}

			const finalPrompt = `${personalityContext}${processedInput}`;

			// Log the final prompt being sent to the LLM
			console.log('Final prompt sent to AI:', finalPrompt);

			// Get AI response
			const aiResponse = await callAI(finalPrompt);
			console.log('AI Response received:', aiResponse); // Debug log

			// Translate response if needed
			let finalResponse = aiResponse;
			if (selectedLanguage !== 'en') {
				finalResponse = await translateText(aiResponse, selectedLanguage);
			}

			// Update messages with AI response
			setMessages((prev) =>
				prev.map((msg) =>
					msg.isLoading
						? {
								id: Date.now() + 1,
								text: finalResponse,
								sender: 'ai',
						  }
						: msg
				)
			);
		} catch (error) {
			console.error('Error in handleSendMessage:', error);
			setError('Failed to get response. Please try again.');
			setMessages((prev) => prev.filter((msg) => !msg.isLoading));
		} finally {
			setIsLoading(false);
			stopResponseTimer();
		}
	};
	return (
		<div className='message-sender-container'>
			<form onSubmit={handleSendMessage} className='input-container'>
				<div className='selectors-container'>
					<select
						className='personality-selector'
						onChange={handlePersonalityChange}
					>
						<option value='default'>Default AI</option>
						<option value='friendly'>Friendly AI</option>
						<option value='professional'>Professional AI</option>
					</select>
					<select
						className='language-selector'
						value={selectedLanguage}
						onChange={(e) => setSelectedLanguage(e.target.value)}
					>
						{languageOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>

				<input
					type='text'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder='Type your message...'
					disabled={isLoading}
					className='message-input'
				/>
				<div className='buttons-container'>
					<VoiceInput
						onSpeechResult={handleSpeechResult}
						isLoading={isLoading}
					/>
					<button
						type='submit'
						className='send-btn'
						disabled={isLoading || !input.trim()}
						data-tooltip={isLoading ? 'Stop Search' : 'Send Message'}
						aria-label={isLoading ? 'Stop Search' : 'Send Message'}
					>
						{isLoading ? <RefreshCw className='animate-spin' /> : <Send />}
					</button>
				</div>
			</form>
		</div>
	);
};

export default MessageSender;
