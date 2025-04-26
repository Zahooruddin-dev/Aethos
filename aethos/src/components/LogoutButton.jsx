import React from 'react';
import { LogOut } from 'lucide-react'; // Import the logout icon
import { auth } from '../firebase/firebase'; // Adjust the import path as necessary

const LogoutButton = ({ onLogout }) => {
	const handleLogout = async () => {
		try {
			await auth.signOut();
			localStorage.removeItem('token');
			if (onLogout) {
				onLogout(); // Call the onLogout prop to handle additional actions
			}
			window.location.href = '/login';
		} catch (error) {
			console.error('Logout error:', error);
			alert('Failed to logout. Please try again.'); // Simple alert for error handling
		}
	};

	return (
		<button
			onClick={handleLogout}
			className='logout-btn'
			data-tooltip='Logout'
			aria-label='Logout'
		>
			<LogOut size={18} />
		</button>
	);
};

export default LogoutButton;
