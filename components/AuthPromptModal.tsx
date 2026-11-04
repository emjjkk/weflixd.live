'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Film, Bookmark, Eye, Star, Heart, ArrowRight } from 'lucide-react';
import { useModal } from '@/context/ModalContext';
import {Logo} from './Logo';

export default function AuthPromptModal() {
  const { isAuthPromptOpen, authPromptMessage, closeAuthPrompt } = useModal();

  useEffect(() => {
    if (isAuthPromptOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeAuthPrompt();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isAuthPromptOpen, closeAuthPrompt]);

  if (!isAuthPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/75 backdrop-blur-sm transition-opacity"
        onClick={closeAuthPrompt}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden z-10 transition-all p-6 sm:p-8 space-y-6"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthPrompt}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Icon */}
        <div className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14">
            <Logo size={40}/>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign In to Weflixd
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {authPromptMessage ||
              'Sign in to browse 1000+ movies and TV shows, build your personal watchlist, log what you have watched, and rate titles.'}
          </p>
        </div>

        {/* Perks / Features preview */}
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 p-4 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
            <Bookmark className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Save to your personal <strong>Watchlist</strong> across all devices</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
            <Eye className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Keep a diary of films & shows <strong>you have watched</strong></span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
            <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>Curate your <strong>Favorite</strong> movies and TV series</span>
          </div>
          <div className="flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300">
            <Star className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>Write <strong>Community Reviews</strong> and share your ratings</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/login"
            id="btn-auth-prompt-signin"
            onClick={closeAuthPrompt}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm shadow-md transition-all group" prefetch={false}>
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={closeAuthPrompt}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Continue Browsing
          </button>
        </div>

        {/* Sign up prompt link */}
        <div className="text-center pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/signup"
              onClick={closeAuthPrompt}
              className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline" prefetch={false}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
