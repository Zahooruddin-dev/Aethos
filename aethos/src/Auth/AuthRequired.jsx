import React from "react";
import { Navigate } from "react-router-dom";

const AuthRequired = ({ children }) => {
	const isAuthenticated = localStorage.getItem("token") !== null;

	if (!isAuthenticated) {
		return <Navigate to="/login" />;
	}

	return children;
};

export default AuthRequired;
