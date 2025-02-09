import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	Bot,
	Send,
	Clipboard,
	RefreshCw,
	Trash2,
	LogOut,
	MessageCircle,
	Menu,
	PlusCircle,
	FileDown,
	Timer,
	Pin,
} from 'lucide-react';
import axios from 'axios';
import Markdown from 'react-markdown';
import { auth } from '../firebase/firebase';
import Sidebar from './Sidebar/Sidebar';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // For better text handling
import ReactDOM from 'react-dom/client';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

// Global cache for translations to avoid redundant API calls.
const translationCache = new Map();

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
	const [responseTimer, setResponseTimer] = useState(0);
	const timerRef = useRef(null);
	const [isFusionAIEnabled, setIsFusionAIEnabled] = useState(true);
	const [chatSessions, setChatSessions] = useState(() => {
		const saved = localStorage.getItem('chatSessions');
		return saved ? JSON.parse(saved) : [];
	});
	const [selectedPersonality, setSelectedPersonality] = useState('default');
	const [selectedLanguage, setSelectedLanguage] = useState('en');
	const [pinnedMessages, setPinnedMessages] = useState([]);
	const abortController = useRef(null); // Create a ref to hold the AbortController

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'es', label: 'Spanish' },
		{ value: 'fr', label: 'French' },
		{ value: 'de', label: 'German' },
		{ value: 'it', label: 'Italian' },
		{ value: 'pt', label: 'Portuguese' },
		{ value: 'ru', label: 'Russian' },
		{ value: 'ja', label: 'Japanese' },
		{ value: 'ko', label: 'Korean' },
		{ value: 'zh', label: 'Chinese' },
	];

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

	const startResponseTimer = () => {
		setResponseTimer(0);
		timerRef.current = setInterval(() => {
			setResponseTimer((prev) => prev + 1);
		}, 1000);
	};

	const stopResponseTimer = () => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const toggleFusionAI = () => {
		setIsFusionAIEnabled((prev) => !prev);
	};

	const callGeminiModel = async (input) => {
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
						model: 'google/gemini-pro',
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
						model: 'anthropic/claude-3-opus', // Using Claude for enhancement
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

	// Advanced version of translateText with caching and improved error handling.
	const translateText = async (text, targetLanguage) => {
		if (!text || typeof text !== 'string') return '';

		// Generate a unique cache key based on the target language and text.
		const cacheKey = `${targetLanguage}:${text}`;
		if (translationCache.has(cacheKey)) {
			return translationCache.get(cacheKey);
		}

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
						model: 'qwen/qwen2.5-vl-72b-instruct:free',
						messages: [
							{
								role: 'system',
								content: `You are a translation assistant. Translate the following text to ${targetLanguage}. Only respond with the translation, nothing else.`,
							},
							{
								role: 'user',
								content: text,
							},
						],
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.text();
				console.error('Translation API Error Response:', errorData);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (!data?.choices?.[0]?.message?.content) {
				throw new Error('Invalid response format from Translation API');
			}

			const translatedText = data.choices[0].message.content;
			// Cache the successful translation for future calls.
			translationCache.set(cacheKey, translatedText);

			return translatedText;
		} catch (error) {
			console.error('Translation error:', error);
			// Fallback: return the original text if translation fails.
			return text;
		}
	};

	const getAIResponse = async (input) => {
		abortController.current = new AbortController(); // Initialize the AbortController
		const signal = abortController.current.signal; // Get the signal for the fetch request

		try {
			console.log('Sending request with input:', input); // Debug log

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
						model: 'google/gemini-2.0-pro-exp-02-05:free',
						messages: [
							{
								role: 'user',
								content: input,
							},
						],
					}),
					signal, // Pass the signal to the fetch request
				}
			);

			if (!response.ok) {
				const errorData = await response.text();
				console.error('API Error Response:', errorData);
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log('API Response:', data);

			if (!data?.choices?.[0]?.message) {
				throw new Error('Invalid response format from API');
			}

			return data.choices[0].message.content;
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('Fetch aborted'); // Handle fetch abort
			} else {
				console.error('AI Response error:', error);
				throw new Error('Failed to get AI response');
			}
		}
	};

	const sendMessage = async (e) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		try {
			setIsLoading(true);
			setError(''); // Clear any previous errors

			const userMessage = {
				id: Date.now(),
				text: input,
				sender: 'user',
			};

			// Add loading message
			const loadingMessage = {
				id: Date.now() + 1,
				sender: 'ai',
				isLoading: true,
			};

			setMessages((prev) => [...prev, userMessage, loadingMessage]);
			setInput('');
			startResponseTimer(); // Start the timer for response

			let processedInput = input;
			if (selectedLanguage !== 'en') {
				try {
					const translatedToEnglish = await translateText(input, 'English');
					processedInput = translatedToEnglish;
				} catch (error) {
					console.error('Translation to English failed:', error);
				}
			}

			const aiResponse = await getAIResponse(processedInput);

			let finalResponse = aiResponse;
			if (selectedLanguage !== 'en') {
				try {
					finalResponse = await translateText(aiResponse, selectedLanguage);
				} catch (error) {
					console.error('Translation of response failed:', error);
				}
			}

			// Replace loading message with actual response
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
			console.error('Error in sendMessage:', error);
			setError('Failed to get response. Please try again.');
			// Remove loading message if there's an error
			setMessages((prev) => prev.filter((msg) => !msg.isLoading));
		} finally {
			setIsLoading(false);
			stopResponseTimer(); // Stop the timer when response is received
		}
	};

	const handleLogout = async () => {
		try {
			await auth.signOut();
			localStorage.removeItem('token');
			clearHistory();
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout error:', error);
			setError('Failed to logout. Please try again.');
		}
	};

	const startNewChat = () => {
		// Save current chat to history if there are messages
		if (messages.length > 0) {
			const currentTime = new Date();
			const chatSession = {
				id: Date.now(),
				messages: messages,
				timestamp: currentTime.toISOString(),
				title: messages[0]?.text.substring(0, 30) + '...' || 'New Chat',
			};

			// Get existing chats from localStorage
			const existingChats = JSON.parse(
				localStorage.getItem('chatSessions') || '[]'
			);

			// Add new chat session
			const updatedChats = [chatSession, ...existingChats];

			// Keep only last 10 chat sessions
			const limitedChats = updatedChats.slice(0, 10);

			// Save to localStorage
			localStorage.setItem('chatSessions', JSON.stringify(limitedChats));
		}

		// Clear current messages
		setMessages([]);
		setInput('');
	};

	const downloadPDF = async (text, messageId) => {
		try {
			// Initialize PDF
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
				putOnlyUsedFonts: true,
			});

			// Set margins and usable page dimensions
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const margin = 20; // 20mm margins
			const usableWidth = pageWidth - 2 * margin;

			// Add header
			pdf.setFontSize(18);
			pdf.setTextColor(40);
			pdf.text('Chat Conversation', pageWidth / 2, margin, { align: 'center' });

			// Add timestamp
			pdf.setFontSize(10);
			pdf.setTextColor(100);
			pdf.text(new Date().toLocaleString(), pageWidth / 2, margin + 7, {
				align: 'center',
			});

			// Create a temporary div for markdown rendering
			const tempDiv = document.createElement('div');
			tempDiv.className = 'pdf-markdown-content';
			document.body.appendChild(tempDiv);

			// Render markdown content
			const root = ReactDOM.createRoot(tempDiv);
			root.render(
				<div className='pdf-content'>
					<ReactMarkdown>{text}</ReactMarkdown>
				</div>
			);

			// Wait for rendering
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Convert markdown content to canvas
			const canvas = await html2canvas(tempDiv, {
				scale: 2,
				logging: false,
				useCORS: true,
				backgroundColor: '#ffffff',
			});

			// Clean up temporary div
			document.body.removeChild(tempDiv);

			// Calculate dimensions
			const imgData = canvas.toDataURL('image/jpeg', 1.0);
			const imgWidth = usableWidth;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			let heightLeft = imgHeight;
			let position = margin + 20; // Start after header
			let page = 1;

			// Add first page content
			pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
			heightLeft -= pageHeight - position - margin;

			// Add additional pages if needed
			while (heightLeft > 0) {
				pdf.addPage();
				page++;
				position = margin;
				pdf.addImage(
					imgData,
					'JPEG',
					margin,
					position,
					imgWidth,
					imgHeight,
					'',
					'FAST',
					0,
					-(pageHeight - margin - 20) * (page - 1)
				);
				heightLeft -= pageHeight - margin * 2;

				// Add page number
				pdf.setFontSize(10);
				pdf.text(`Page ${page}`, pageWidth / 2, pageHeight - 10, {
					align: 'center',
				});
			}

			// Add page number to first page
			pdf.setPage(1);
			pdf.text(`Page 1 of ${page}`, pageWidth / 2, pageHeight - 10, {
				align: 'center',
			});

			// Save the PDF
			pdf.save(`chat-conversation-${messageId}.pdf`);
		} catch (error) {
			console.error('PDF generation failed:', error);
		}
	};

	const saveChatHistory = (messages) => {
		const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
		chatHistory.push({ timestamp: new Date(), messages });
		localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
	};

	// Call this function when a chat session ends
	const endChatSession = () => {
		saveChatHistory(messages);
	};

	const handlePersonalityChange = (e) => {
		setSelectedPersonality(e.target.value);
	};

	const startVoiceRecognition = () => {
		const recognition = new window.SpeechRecognition();
		recognition.onresult = (event) => {
			const transcript = event.results[0][0].transcript;
			setInput(transcript); // Set the input state to the recognized text
		};
		recognition.start();
	};

	const speakResponse = (text) => {
		const utterance = new SpeechSynthesisUtterance(text);
		window.speechSynthesis.speak(utterance);
	};

	const fetchSearchResults = async (query) => {
		const response = await fetch(`https://api.example.com/search?q=${query}`);
		const data = await response.json();
		return data.results; // Adjust based on your API response structure
	};

	const summarizeText = async (text) => {
		const response = await fetch('https://api.example.com/summarize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text }),
		});
		const data = await response.json();
		return data.summary; // Adjust based on your API response structure
	};

	const handleLanguageChange = (e) => {
		setSelectedLanguage(e.target.value);
	};

	const pinMessage = (messageId) => {
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

	const unpinMessage = (messageId) => {
		setPinnedMessages((prev) => prev.filter((id) => id !== messageId)); // Unpin the message
	};

	const stopSearch = () => {
		// Logic to stop the ongoing search
		if (abortController.current) {
			abortController.current.abort(); // Abort the fetch request
		}
		stopResponseTimer(); // Stop the response timer if applicable
		setIsLoading(false); // Set loading state to false
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
						Mizuka Chat <Bot size={20} />
					</h2>

					<div className='header-buttons'>
						<button
							onClick={startNewChat}
							className='new-chat-btn'
							data-tooltip='Start New Chat'
							aria-label='Start New Chat'
						>
							<PlusCircle size={18} />
						</button>
						<button
							onClick={clearHistory}
							className='clear-btn'
							data-tooltip='Clear Chat History'
							aria-label='Clear Chat History'
						>
							<Trash2 size={18} />
						</button>
						<button
							onClick={handleLogout}
							className='logout-btn'
							data-tooltip='Logout'
							aria-label='Logout'
						>
							<LogOut size={18} />
						</button>
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
											<button
												onClick={() => downloadPDF(msg.text, msg.id)}
												className='icon-btn'
												data-tooltip='Download as PDF'
												aria-label='Download as PDF'
											>
												<FileDown size={14} />
											</button>
											<button
												onClick={() => pinMessage(msg.id)}
												className='icon-btn'
												data-tooltip='Pin Message'
												aria-label='Pin Message'
											>
												<Pin size={14} />
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

				<form onSubmit={sendMessage} className='input-container'>
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
					/>
					<button
						type='button'
						className='send-btn'
						data-tooltip='Send Message'
						aria-label='Send Message'
						onClick={isLoading ? stopSearch : sendMessage}
					>
						{isLoading ? <RefreshCw className='animate-spin' /> : <Send />}
					</button>
				</form>
			</div>
		</div>
	);
};

export default ChatApp;
