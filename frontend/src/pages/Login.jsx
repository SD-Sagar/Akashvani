import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Signature from '../components/Signature';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--background)] to-[var(--pane-bg)] p-4">
      <div className="glass p-8 md:p-10 rounded-3xl w-full max-w-md z-10 relative">
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <Logo className="w-16 h-16 flex-col" />
        </div>
        <h2 className="text-3xl font-bold mb-6 mt-2 text-center tracking-tight">Welcome Back</h2>
        {error && <p className="text-red-500 mb-4 text-center text-sm bg-red-500/10 py-2 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sagar-blue hover:bg-sagar-blue-hover text-white p-3 rounded-xl font-semibold transition-colors duration-300 shadow-lg shadow-sagar-blue/30"
          >
            Login
          </button>
        </form>
        <p className="mt-6 text-center text-sm opacity-80">
          Don't have an account? <Link to="/register" className="text-sagar-blue font-semibold hover:underline">Register here</Link>
        </p>
        <Signature className="mt-6" />
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-sagar-blue/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default Login;
