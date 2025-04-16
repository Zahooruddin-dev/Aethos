import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Clipboard, Trash2, Menu, Pin, Volume2, VolumeX, Download, Upload } from 'lucide-react';
import Markdown from 'react-markdown';
import Sidebar from './Sidebar/Sidebar';
import 'jspdf-autotable'; // For better text handling
import PDFDownloader from './PDFDownloader'; // Import the new component
import LogoutButton from './LogoutButton'; // Import the new component
import NewChatButton from './NewChatButton'; // Import the new component
import { pinMessage } from '../utils/MessageUtils'; // Import the new function
import MessageSender from './MessageSender.jsx'; // Import the new component
import { stopSearch } from '../utils/SearchController'; // Import the new function
import useResponseTimer from '../hooks/useResponseTimer'; // Use the custom hook
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { exportChat, importChat } from '../utils/ChatExport'; // Import the new functions

const ChatApp = () => {
	const [messages, setMessages] = useState(() => {
		const saved = localStorage.getItem('chatHistory');
		return saved ? JSON.parse(saved) : [];
	});
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const messagesEndRef = useRef(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [isFusionAIEnabled, setIsFusionAIEnabled] = useState(true);
	const [chatSessions, setChatSessions] = useState(() => {
		const saved = localStorage.getItem('chatSessions');
		return saved ? JSON.parse(saved) : [];
	});
	const [selectedLanguage, setSelectedLanguage] = useState('en');
	const [pinnedMessages, setPinnedMessages] = useState([]);
	const abortController = useRef(null); // Create a ref to hold the AbortController
	const { speak, stop, isSpeaking } = useTextToSpeech();
	const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

	// Use the custom hook
	const { responseTimer, startResponseTimer, stopResponseTimer } =
		useResponseTimer();

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

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const toggleFusionAI = () => {
		setIsFusionAIEnabled((prev) => !prev);
	};

	const handlePinMessage = (messageId) => {
		pinMessage(messageId, pinnedMessages, setPinnedMessages); // Use the new function
	};

	const handleStopSearch = () => {
		stopSearch(abortController, stopResponseTimer, setIsLoading); // Use the new function
	};

	const handleVoiceResponse = (text) => {
		if (isSpeaking) {
			stop();
		} else {
			speak(text);
		}
	};

	return (
		<div className='chat-layout'>
			<Sidebar
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
				messages={messages}
				pinnedMessages={pinnedMessages}
				setPinnedMessages={setPinnedMessages}
				toggleFusionAI={toggleFusionAI}
				isFusionAIEnabled={isFusionAIEnabled}
			/>

			<div className={`main-content ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
				<div className='chat-header'>
					<button
						className='menu-button-header'
						onClick={() => setIsSidebarOpen(!isSidebarOpen)}
						data-tooltip='Toggle Sidebar'
						aria-label='Toggle Sidebar'
					>
						<Menu size={24} />
					</button>
					<h2>
						M I Z U K A{' '}
						<span>
							{' '}
							<Bot size={30} />
						</span>
					</h2>

					<div className='header-buttons'>
						<NewChatButton clearHistory={clearHistory} messages={messages} />
						<button
							onClick={clearHistory}
							className='clear-btn'
							data-tooltip='Clear Chat History'
							aria-label='Clear Chat History'
						>
							<Trash2 size={18} />
						</button>
						<LogoutButton onLogout={clearHistory} />
						{/* <button
							onClick={() => exportChat(messages)}
							className='export-btn'
							data-tooltip='Export Chat'
							aria-label='Export Chat'
						>
							<Download size={18} />
						</button>
						AN WAY TO EXPORT THE ENTIRE CHAT LOG
					 */}
					</div>
				</div>

				{error && <div className='error-banner'>{error}</div>}

				<div className='messages-list'>
					<AnimatePresence initial={false}>
						{messages.map((msg) => (
							<motion.div
								key={msg.id}
								layout
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}
								className={`message ${msg.sender}`}
							>
								<div className='message-header'>
									<span className='sender-tag'>
										{msg.sender === 'user' ? 'You' : 'Mizuka'}
									</span>
									{msg.sender !== 'user' && !msg.isLoading && (
										<div className='message-actions'>
											<button
												onClick={() => navigator.clipboard.writeText(msg.text)}
												className='icon-btn'
												data-tooltip='Copy to Clipboard'
												aria-label='Copy to Clipboard'
											>
												<Clipboard size={14} />
											</button>
											<PDFDownloader text={msg.text} messageId={msg.id} />
											<button
												onClick={() => handlePinMessage(msg.id)}
												className='icon-btn'
												data-tooltip='Pin Message'
												aria-label='Pin Message'
											>
												<Pin size={14} />
											</button>
											<button
												onClick={() => handleVoiceResponse(msg.text)}
												className='icon-btn'
												data-tooltip={isSpeaking ? 'Stop Speaking' : 'Speak Message'}
												aria-label={isSpeaking ? 'Stop Speaking' : 'Speak Message'}
											>
												{isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
											</button>
										</div>
									)}
								</div>
								<div className='message-content'>
									{msg.isLoading ? (
										<div className='loading-container'>
											<Bot className='animate-pulse' size={16} />
											<motion.span
												className='thinking-text'
												animate={{ opacity: [0.4, 1, 0.4] }}
												transition={{
													repeat: Infinity,
													duration: 1.5,
													ease: 'linear',
												}}
											>
												thinking...{' '}
												{responseTimer > 0 && `(${formatTime(responseTimer)})`}
											</motion.span>
										</div>
									) : (
										<Markdown>{msg.text}</Markdown>
									)}
								</div>
							</motion.div>
						))}
					</AnimatePresence>
					<div ref={messagesEndRef} />
				</div>

				<MessageSender
					input={input}
					setInput={setInput}
					setMessages={setMessages}
					setIsLoading={setIsLoading}
					setError={setError}
					selectedLanguage={selectedLanguage}
					startResponseTimer={startResponseTimer}
					stopResponseTimer={stopResponseTimer}
					isLoading={isLoading}
					abortController={abortController}
				/>
			</div>
		</div>
	);
};

export default ChatApp;
