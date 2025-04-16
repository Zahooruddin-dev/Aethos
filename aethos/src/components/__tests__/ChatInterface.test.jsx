import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChatApp from '../ChatInterface';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

// Mock the useTextToSpeech hook
vi.mock('../../hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isSpeaking: false,
    setVoice: vi.fn(),
  }),
}));

describe('ChatApp', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock speechSynthesis
    const speechSynthesisMock = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
    };
    Object.defineProperty(window, 'speechSynthesis', { value: speechSynthesisMock });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders chat interface', () => {
    render(<ChatApp />);
    expect(screen.getByText(/M I Z U K A/i)).toBeInTheDocument();
  });

  test('sends message and receives response', async () => {
    render(<ChatApp />);
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByLabelText(/send message/i);

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });
  });

  test('clears chat history', () => {
    render(<ChatApp />);
    const clearButton = screen.getByLabelText(/clear chat history/i);
    fireEvent.click(clearButton);
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('chatHistory');
  });

  test('toggles text-to-speech', async () => {
    render(<ChatApp />);
    const message = 'Test message';
    
    // Add a message to the chat
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByLabelText(/send message/i);
    
    fireEvent.change(input, { target: { value: message } });
    fireEvent.click(sendButton);
    
    // Wait for the message to appear and test TTS button
    await waitFor(() => {
      const ttsButton = screen.getByLabelText(/speak message/i);
      fireEvent.click(ttsButton);
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });
});