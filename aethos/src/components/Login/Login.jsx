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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem('token', token);
      navigate('/');
    } catch (error) {
      console.log('Firebase error:', error.code, error.message);
      
      if (error.code === 'auth/user-not-found') {
        // Email is not registered
        navigate('/register', { 
          state: { 
            email: email,
            message: 'No account found with this email. Please register.' 
          }
        });
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Incorrect password');
      } else {
        handleError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
    <div className="login-container">
      <h2>Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <div className="button-container">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          <button 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
            className="google-sign-in-button"
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google icon" 
            />
          </button>
        </div>
      </form>
      <div className="auth-links">
        <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};
export default Login;