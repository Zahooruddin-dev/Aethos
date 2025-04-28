import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebase';
import './Login.css';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			await signInWithEmailAndPassword(auth, email, password);
			// No need to manually handle token storage - Firebase handles it
			navigate('/');
		} catch (error) {
			console.error('Login error:', error);
			handleError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setIsLoading(true);
		setError('');

		try {
			await signInWithPopup(auth, googleProvider);
			// No need to manually handle token storage - Firebase handles it
			navigate('/');
		} catch (error) {
			handleError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleError = (error) => {
		switch (error.code) {
			case 'auth/invalid-email':
				setError('Invalid email address');
				break;
			case 'auth/user-disabled':
				setError('This account has been disabled');
				break;
			default:
				setError('Login failed. Please try again.');
		}
	};

	return (
		<div className='login-container'>
			<h2>Login</h2>
			{error && <div className='error-message' role="alert">{error}</div>}
			<form onSubmit={handleSubmit} name="login" autoComplete="on">
				<div className="form-group">
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type='email'
						name="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder='Email'
						required
						autoComplete="username"
					/>
				</div>
				<div className="form-group">
					<label htmlFor="password">Password</label>
					<input
						id="password"
						type='password'
						name="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder='Password'
						required
						autoComplete="current-password"
					/>
				</div>
				<div className='button-container'>
					<button type='submit' disabled={isLoading}>
						{isLoading ? 'Logging in...' : 'Login'}
					</button>
					<button
						type="button"
						onClick={handleGoogleSignIn}
						disabled={isLoading}
						className='google-sign-in-button'
					>
						<img src='https://www.google.com/favicon.ico' alt='Google icon' />
					</button>
				</div>
			</form>
			<div className='auth-links'>
				<Link to='/forgot-password' className='forgot-password-link'>
					Forgot Password?
				</Link>
				<p>
					Don't have an account? <Link to='/register'>Register</Link>
				</p>
			</div>
		</div>
	);
};
export default Login;
