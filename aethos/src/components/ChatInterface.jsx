import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Clipboard, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';
import Markdown from 'react-markdown';
import '../index.css';

const ChatApp = () => {
	const [messages, setMessages] = useState(() => {
		const saved = localStorage.getItem('chatHistory');
		return saved ? JSON.parse(saved) : [];
	});
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const messagesEndRef = useRef(null);

	useEffect(() => {
		localStorage.setItem('chatHistory', JSON.stringify(messages));
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	const clearHistory = () => {
		setMessages([]);
		localStorage.removeItem('chatHistory');
	};

	const handleError = (error) => {
		console.error('API Error:', error);
		const errorMessage =
			error.response?.data?.error?.message ||
			error.response?.data?.message ||
			'Failed to fetch response. Please try again.';

		setError(errorMessage);
		setTimeout(() => setError(''), 5000);
	};
	const sendMessage = async (e) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage = { id: Date.now(), text: input, sender: 'user' };
		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setIsLoading(true);
		setError('');

		try {
			// Enhanced prompt with humanization instructions
			const humanizePrompt = `${input}`;

			const response = await axios.post(
				`${import.meta.env.VITE_OPENROUTER_API_URL}/chat/completions`,
				{
					model: "qwen/qwen-vl-plus:free",
					messages: [
						{
							role: 'user',
							content: humanizePrompt,
						},
					],
				},
				{
					headers: {
						Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
						'Content-Type': 'application/json',
					},
				}
			);

			const aiText =
				response.data?.choices?.[0]?.message?.content ||
				response.data?.result?.content ||
				'Could not understand response format';

			const aiResponse = {
				id: Date.now() + 1,
				text: aiText,
				sender: 'ai',
			};

			setMessages((prev) => [...prev, aiResponse]);
		} catch (error) {
			handleError(error);
			const errorMessage = {
				id: Date.now() + 2,
				text: 'Failed to get response. Please check your connection.',
				sender: 'system',
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='chat-container'>
			<div className='chat-header'>
				<h2>
					Mizuka Chat <Bot size={20} />
				</h2>
				<button onClick={clearHistory} className='clear-btn'>
					<Trash2 size={18} />
				</button>
			</div>

			{error && <div className='error-banner'>{error}</div>}

			<div className='messages-list'>
				<AnimatePresence initial={false}>
					{messages.map((msg) => (
						<motion.div
							key={msg.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							className={`message ${msg.sender}`}
						>
							<div className='message-header'>
								<span className='sender-tag'>
									{msg.sender === 'user' ? 'You' : 'Mizuka'}
								</span>
								{msg.sender !== 'user' && (
									<button
										onClick={() => navigator.clipboard.writeText(msg.text)}
										className='icon-btn'
										title='Copy to clipboard'
									>
										<Clipboard size={14} />
									</button>
								)}
							</div>
							<div className='message-content'>
								<Markdown>{msg.text}</Markdown>
							</div>
						</motion.div>
					))}
				</AnimatePresence>

				{isLoading && (
					<motion.div
						className='loading'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
					>
						<Bot className='animate-pulse' />
						<span>Generating response...</span>
					</motion.div>
				)}
				<div ref={messagesEndRef} />
			</div>

			<form onSubmit={sendMessage} className='input-container'>
				<input
					type='text'
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder='Type your message...'
					disabled={isLoading}
				/>
				<button type='submit' disabled={isLoading} className='send-btn'>
					{isLoading ? <RefreshCw className='spin' /> : <Send />}
				</button>
			</form>
		</div>
	);
};

export default ChatApp;
