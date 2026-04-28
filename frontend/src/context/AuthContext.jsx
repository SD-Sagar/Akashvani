import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.withCredentials = true;

  const fetchMe = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
      setUser(res.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
    setUser(res.data);
  };

  const register = async (formData) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    setUser(res.data);
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setUser(null);
      // Optional: window.location.href = '/login'; // Force a clean slate if needed, but let's try state first
    }
  };

  const updateAvatarState = (newAvatarUrl) => {
    setUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  const removeFriendState = (friendId) => {
    setUser(prev => ({
      ...prev,
      friends: prev.friends.filter(f => f._id !== friendId)
    }));
  };

  const updateFriends = (friend) => {
    setUser((prev) => ({
      ...prev,
      friends: [...prev.friends, friend]
    }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateFriends, updateAvatarState, removeFriendState, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
};
