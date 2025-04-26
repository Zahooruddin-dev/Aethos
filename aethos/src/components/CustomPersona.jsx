import React, { useState } from 'react';

const [personaName, setPersonaName] = useState('');
const [personaTraits, setPersonaTraits] = useState('');

const savePersona = () => {
	const personas = JSON.parse(localStorage.getItem('personas')) || [];
	personas.push({ name: personaName, traits: personaTraits });
	localStorage.setItem('personas', JSON.stringify(personas));
};
