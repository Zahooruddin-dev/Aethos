import React from 'react';
import { RefreshCw, Send } from 'lucide-react';
import translateText from '../api/TranslationAPI';
import getAIResponse from '../api/AIResponseAPI';
import { languageOptions } from '../utils/LanguageOptions';

const MessageSender = ({ 
    input, 
    setInput, 
    setMessages, 
    setIsLoading, 
    setError, 
    selectedLanguage, 
    setSelectedLanguage,
    startResponseTimer, 
    stopResponseTimer,
    isLoading,
    abortController,
    handlePersonalityChange
}) => {
    console.log('MessageSender rendered with input:', input); // Debug log

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
            setMessages(prev => [...prev, userMessage, loadingMessage]);
            setInput('');
            startResponseTimer();

            // Process input with translation if needed
            let processedInput = input;
            if (selectedLanguage !== 'en') {
                const translatedToEnglish = await translateText(input, 'English');
                processedInput = translatedToEnglish;
            }

            // Pass abortController to getAIResponse
            const aiResponse = await getAIResponse(processedInput, abortController);
            console.log('AI Response received:', aiResponse); // Debug log

            // Translate response if needed
            let finalResponse = aiResponse;
            if (selectedLanguage !== 'en') {
                finalResponse = await translateText(aiResponse, selectedLanguage);
            }

            // Update messages with AI response
            setMessages(prev => 
                prev.map(msg => 
                    msg.isLoading ? {
                        id: Date.now() + 1,
                        text: finalResponse,
                        sender: 'ai',
                    } : msg
                )
            );

        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            setError('Failed to get response. Please try again.');
            setMessages(prev => prev.filter(msg => !msg.isLoading));
        } finally {
            setIsLoading(false);
            stopResponseTimer();
        }
    };

    const handlePersonalityChange = (e) => {
        console.log('Personality changed to:', e.target.value);
        setSelectedPersonality(e.target.value);
    };

    return (
        <div className="message-sender-container">
            <form onSubmit={handleSendMessage} className="input-container">
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
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="message-input"
                />
                <button
                    type="submit"
                    className="send-btn"
                    disabled={isLoading || !input.trim()}
                    data-tooltip={isLoading ? 'Stop Search' : 'Send Message'}
                    aria-label={isLoading ? 'Stop Search' : 'Send Message'}
                >
                    {isLoading ? <RefreshCw className="animate-spin" /> : <Send />}
                </button>
            </form>
        </div>
    );
};

export default MessageSender; 