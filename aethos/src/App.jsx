import React from 'react';
import ChatApp from './components/ChatInterface';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './components/Login/Login';
import AuthRequired from './Auth/AuthRequired';
import { Navigate } from 'react-router-dom';
import Register from './components/Register/Register';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';

// Add new guard component
const RedirectIfAuthenticated = ({ children }) => {
	const isAuthenticated = localStorage.getItem('token'); // or however you check auth
	
	if (isAuthenticated) {
		return <Navigate to="/" replace />;
	}
	
	return children;
};

function App() {
	
	return (
		<BrowserRouter>
			<Routes>
				<Route 
					path="/" 
					element={
						<AuthRequired>
							<ChatApp />
						</AuthRequired>
					} 
				/>
				<Route 
					path="/login" 
					element={
						<RedirectIfAuthenticated>
							<Login />
						</RedirectIfAuthenticated>
					} 
				/>
				<Route path="/register" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App;
