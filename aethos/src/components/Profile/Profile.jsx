import React, { useState } from 'react';
import { auth } from '../../firebase/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: auth.currentUser?.email || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await updatePassword(auth.currentUser, formData.newPassword);
      setSuccess('Password updated successfully');
      setFormData({ ...formData, newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={24} />
        </button>
        <h2>Profile Settings</h2>
      </div>

      <div className="profile-content">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-section">
          <h3>Account Information</h3>
          <div className="info-item">
            <label>Email</label>
            <p>{auth.currentUser?.email}</p>
          </div>
          <div className="info-item">
            <label>Model</label>
            <p>Gemini Pro 2.0</p>
          </div>
        </div>

        <form onSubmit={handlePasswordUpdate} className="password-section">
          <h3>Change Password</h3>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New Password"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm New Password"
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile; 