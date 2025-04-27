import { useState } from 'react';

export const languageOptions = [
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

// New hook to manage selected language
export const useLanguage = () => {
	const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language

	return {
		selectedLanguage,
		setSelectedLanguage,
	};
};
