import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/firebase';
import './Register.css';

const Register = () => {
	const location = useLocation();
	const [formData, setFormData] = useState({
		firstName: '',
		middleName: '',
		lastName: '',
		username: '',
		email: location.state?.email || '',
		password: '',
		confirmPassword: '',
	});
	const [error, setError] = useState('');
	const [message, setMessage] = useState(location.state?.message || '');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		if (message) {
			const timer = setTimeout(() => {
				setMessage('');
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [message]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			return;
		}
		setIsLoading(true);
		setError('');

		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				formData.email,
				formData.password
			);
			const token = await userCredential.user.getIdToken();
			localStorage.setItem('token', token); // Persist token
			navigate('/');
		} catch (error) {
			handleError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		setIsLoading(true);
		setError('');

		try {
			const result = await signInWithPopup(auth, googleProvider);
			const token = await result.user.getIdToken();
			localStorage.setItem('token', token);
			navigate('/');
		} catch (error) {
			handleError(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleError = (error) => {
		switch (error.code) {
			case 'auth/email-already-in-use':
				setError('Email is already registered');
				break;
			case 'auth/invalid-email':
				setError('Invalid email address');
				break;
			case 'auth/weak-password':
				setError('Password should be at least 6 characters');
				break;
			default:
				setError('Registration failed. Please try again.');
		}
	};

	return (
		<div className='register-container'>
			<div className='register-form'>
				<h2>Create Account</h2>
				{message && <div className='info-message' role="alert">{message}</div>}
				{error && <div className='error-message' role="alert">{error}</div>}
				<form onSubmit={handleSubmit} name="register" autoComplete="on">
					<div className='name-group'>
						<div className="form-group">
							<label htmlFor="firstName">First Name</label>
							<input
								id="firstName"
								type='text'
								name='given-name'
								value={formData.firstName}
								onChange={handleChange}
								placeholder='First Name'
								required
								autoComplete="given-name"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="middleName">Middle Name</label>
							<input
								id="middleName"
								type='text'
								name='additional-name'
								value={formData.middleName}
								onChange={handleChange}
								placeholder='Middle Name (Optional)'
								autoComplete="additional-name"
							/>
						</div>
						<div className="form-group">
							<label htmlFor="lastName">Last Name</label>
							<input
								id="lastName"
								type='text'
								name='family-name'
								value={formData.lastName}
								onChange={handleChange}
								placeholder='Last Name'
								required
								autoComplete="family-name"
							/>
						</div>
					</div>
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							id="username"
							type='text'
							name='username'
							value={formData.username}
							onChange={handleChange}
							placeholder='Username'
							required
							autoComplete="username"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="email">Email</label>
						<input
							id="email"
							type='email'
							name='email'
							value={formData.email}
							onChange={handleChange}
							placeholder='Email'
							required
							autoComplete="email"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="new-password">Password</label>
						<input
							id="new-password"
							type='password'
							name='new-password'
							value={formData.password}
							onChange={handleChange}
							placeholder='Password'
							required
							autoComplete="new-password"
						/>
					</div>
					<div className="form-group">
						<label htmlFor="confirm-password">Confirm Password</label>
						<input
							id="confirm-password"
							type='password'
							name='confirm-password'
							value={formData.confirmPassword}
							onChange={handleChange}
							placeholder='Confirm Password'
							required
							autoComplete="new-password"
						/>
					</div>
					<div className='button-container'>
						<button type='submit' disabled={isLoading}>
							{isLoading ? 'Creating Account...' : 'Register'}
						</button>
						<button
							type='button'
							onClick={handleGoogleSignUp}
							disabled={isLoading}
							className='google-sign-in-button'
						>
							<img
								src='https://developers.google.com/identity/images/g-logo.png'
								alt='Google icon'
								className='google-icon'
							/>
						</button>
					</div>
				</form>
				<div className='auth-links'>
					<p>
						Already have an account? <Link to='/login'>Login</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

export default Register;
