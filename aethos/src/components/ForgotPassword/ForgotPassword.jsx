import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess('');

		try {
			await sendPasswordResetEmail(auth, email);
			setSuccess('Password reset email has been sent! Check your inbox.');
			setEmail('');
		} catch (error) {
			switch (error.code) {
				case 'auth/user-not-found':
					setError('No account found with this email address');
					break;
				case 'auth/invalid-email':
					setError('Invalid email address');
					break;
				default:
					setError('Failed to send reset email. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='forgot-password-container'>
			<div className='forgot-password-form'>
				<h2>Reset Password</h2>
				{error && <div className='error-message'>{error}</div>}
				{success && <div className='success-message'>{success}</div>}
				<form onSubmit={handleSubmit}>
					<input
						type='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='Enter your email'
						required
					/>
					<button type='submit' disabled={isLoading}>
						{isLoading ? 'Sending...' : 'Sent Reset Link'}
					</button>
				</form>
				<div className='auth-links'>
					<p>
						Remembered your password? <Link to='/login'>Login</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default ForgotPassword;
