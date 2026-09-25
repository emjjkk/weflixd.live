'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function SignUpPage() {
  const { signUpWithEmail, loginWithDiscord, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== passwordConfirmation) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      router.push('/');
    } catch (err: any) {
      const message = err?.message || 'Failed to create account. Please try again.';
      if (message.toLowerCase().includes('already registered')) {
        setErrorMsg('An account with this email already exists. Try signing in instead.');
      } else {
        setErrorMsg(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscordSignUp = async () => {
    setErrorMsg(null);
    setIsDiscordLoading(true);
    try {
      await loginWithDiscord();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to connect to Discord.');
      setIsDiscordLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 text-center space-y-4">
        <p className="text-sm text-zinc-500">You are already signed in as @{user.username}.</p>
        <Link
          href={`/profile/${user.username}`}
          className="inline-block px-4 py-2 text-xs font-semibold rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
        >
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 text-zinc-900 dark:text-white">
            <Logo size={40} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Create Your Account
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Join the Weflixd community. Instant signup with no email verification required.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Email & Password Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Choose a Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Confirmation */}
          <div className="space-y-1.5">
            <label
              htmlFor="signup-password-confirmation"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="signup-password-confirmation"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={6}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-signup-submit"
            disabled={isSubmitting || isDiscordLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm shadow-md transition-all disabled:opacity-50 group"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
          <span className="bg-white dark:bg-zinc-900 px-3 text-xs uppercase tracking-wider text-zinc-400 font-medium absolute">
            or
          </span>
        </div>

        {/* Discord OAuth */}
        <div>
          <button
            type="button"
            id="btn-signup-discord"
            onClick={handleDiscordSignUp}
            disabled={isSubmitting || isDiscordLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>{isDiscordLoading ? 'Connecting to Discord...' : 'Sign up with Discord'}</span>
          </button>
        </div>

        {/* Footer link */}
        <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-zinc-900 dark:text-zinc-100 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
