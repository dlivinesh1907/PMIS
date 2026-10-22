import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gauge, Lock, Mail, ArrowRight, ShieldCheck, Wrench, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 bg-gradient-to-tr from-slate-950 via-slate-900 to-sky-950 text-white text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/30 mb-3">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">PMIS Industrial Suite</h2>
          <p className="text-xs text-slate-300 mt-1">Predictive Maintenance Intelligence System</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@factory.com"
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Gateway'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Credentials Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Roles
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@factory.com')}
                className="p-2 border border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl text-center transition-all"
              >
                <ShieldCheck className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <span className="font-bold text-[11px] text-slate-700 block">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('engineer@factory.com')}
                className="p-2 border border-slate-200 hover:border-sky-300 hover:bg-sky-50 rounded-xl text-center transition-all"
              >
                <Wrench className="w-4 h-4 mx-auto text-sky-600 mb-1" />
                <span className="font-bold text-[11px] text-slate-700 block">Engineer</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('operator@factory.com')}
                className="p-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl text-center transition-all"
              >
                <User className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <span className="font-bold text-[11px] text-slate-700 block">Operator</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Need an account?{' '}
            <Link to="/register" className="font-bold text-sky-600 hover:text-sky-700">
              Register Operator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
