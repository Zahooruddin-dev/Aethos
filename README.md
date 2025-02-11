
![Screenshot](Screenshot%20(13).png)

## Fusion AI

The Fusion AI feature leverages advanced machine learning models to provide intelligent responses based on user input. It utilizes the `callFusionModel` function to interact with the AI model, which processes the input and returns a relevant response. The implementation includes error handling and retry logic to ensure robust communication with the AI service.

### Key Features:
- **Asynchronous Communication**: The AI model is called asynchronously, allowing for a smooth user experience.
- **Error Handling**: The system retries requests in case of rate limits or other errors, ensuring reliability.
- **Response Validation**: The responses from the AI are validated to ensure they meet the expected structure.

## Translation Feature

The translation feature allows users to communicate in multiple languages. It uses the `translateText` function to translate user input into English before sending it to the AI model. The response from the AI can also be translated back into the user's selected language.

### Key Features:
- **Caching**: Translations are cached to improve performance and reduce API calls.
- **Language Selection**: Users can select their preferred language, enhancing accessibility and user experience.
- **Fallback Mechanism**: If translation fails, the original text is returned, ensuring that the user can still communicate effectively.

To make this work for you, you need to have these api keys in env 

VITE_OPENROUTER_API_KEY=
VITE_OPENROUTER_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_GEMINI_API_URL=



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
