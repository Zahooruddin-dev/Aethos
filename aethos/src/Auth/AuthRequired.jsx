import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthRequired = ({ children }) => {
	const { user, loading } = useAuth();

	if (loading) {
		return <div className='loading'>Loading...</div>;
	}

	if (!user) {
		return <Navigate to='/login' />;
	}

	return children;
};

export default AuthRequired;
