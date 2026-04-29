import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { Upload } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('username', formData.username);
      data.append('email', formData.email);
      data.append('password', formData.password);
      if (avatar) {
        data.append('avatar', avatar);
      }
      
      await register(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[var(--background)] to-[var(--pane-bg)] py-10 px-4">
      <div className="glass p-8 md:p-10 rounded-3xl w-full max-w-md z-10 relative">
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 flex-col" />
        </div>
        <h2 className="text-3xl font-bold mb-6 text-center tracking-tight">Create Account</h2>
        {error && <p className="text-red-500 mb-4 text-center text-sm bg-red-500/10 py-2 rounded-lg">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--pane-border)] bg-[var(--input-bg)] flex items-center justify-center group cursor-pointer shadow-lg">
              {preview ? (
                <img src={preview} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload size={32} className="text-gray-400 group-hover:text-sagar-blue transition-colors" />
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-sm mt-2 opacity-70">Upload Avatar (Optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="w-full p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--pane-border)] focus:outline-none focus:ring-2 focus:ring-sagar-blue transition-all"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-sagar-blue hover:bg-sagar-blue-hover text-white p-3 rounded-xl font-semibold transition-colors duration-300 shadow-lg shadow-sagar-blue/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm opacity-80">
          Already have an account? <Link to="/login" className="text-sagar-blue font-semibold hover:underline">Login here</Link>
        </p>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-sagar-blue/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};

export default Register;
