'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { checkAdminSession } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await checkAdminSession();
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Network error during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 px-4 max-w-md mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-dairy-border/80 shadow-dairy space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-dairy-green/10 text-dairy-green mx-auto flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-2xl font-black text-dairy-green-dark">
            Kakria Dairy Admin
          </h1>
          <p className="text-xs text-dairy-muted">
            Management Panel · Authorized Access Only
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-dairy-text mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
              />
              <User className="w-4 h-4 text-dairy-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-dairy-text mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-dairy-border bg-dairy-cream/20 focus:bg-white focus:ring-2 focus:ring-dairy-green text-sm"
              />
              <Lock className="w-4 h-4 text-dairy-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verifying…' : 'Sign In to Storefront Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-dairy-border/60 text-center">
          <p className="text-[11px] text-dairy-muted">
            Customers do not need an account. Guest checkout is available at cart.
          </p>
        </div>
      </div>
    </div>
  );
}
