import { useState, useRef } from 'react';

const useResponseTimer = () => {
	const [responseTimer, setResponseTimer] = useState(0);
	const timerRef = useRef(null);

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

	return { responseTimer, startResponseTimer, stopResponseTimer };
};

export default useResponseTimer;
