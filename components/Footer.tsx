'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 py-12 text-zinc-600 dark:text-zinc-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <span className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-5 flex items-center gap-2">
              <Logo size={40}/> Weflixd.live
            </span>
            <p className="text-xs leading-relaxed max-w-sm text-zinc-500 dark:text-zinc-400">
              The social cinema platform for film & television lovers. Track what you watch, save to your watchlist, rate out of five, and read reviews from the community.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-2">
            <h4 className="text-xs mb-5 font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Explore
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors" prefetch={false}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/movie" className="hover:text-zinc-900 dark:hover:text-white transition-colors" prefetch={false}>
                  Movies
                </Link>
              </li>
              <li>
                <Link href="/tv" className="hover:text-zinc-900 dark:hover:text-white transition-colors" prefetch={false}>
                  TV Shows
                </Link>
              </li>
              <li>
                <Link href="/people" className="hover:text-zinc-900 dark:hover:text-white transition-colors" prefetch={false}>
                  People & Cast
                </Link>
              </li>
              <li>
                <Link href="https://github.com/emjjkk/weflixd.live" className="hover:text-zinc-900 dark:hover:text-white transition-colors" prefetch={false}>
                  Open Source
                </Link>
              </li>
            </ul>
          </div>

          {/* API Attributions & Credits */}
          <div className="space-y-2">
            <h4 className="text-xs mb-5 font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Data & API Credits
            </h4>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                  The Movie Database (TMDB)
                </p>
                <p className="text-[11px] leading-tight">
                  This product uses the TMDB API but is not endorsed or certified by TMDB.
                </p>
              </div>

              <div className="">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-0.5">
                  JustWatch
                </p>
                <p className="text-[11px] leading-tight">
                  Streaming platform availability and watch provider data provided by JustWatch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & tech details */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 md:flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3">
          <p>© {new Date().getFullYear()} Weflixd. Built for film lovers worldwide.</p>
          <div className="md:flex items-center gap-4 mb-1">
            <span className="flex items-center gap-1 mb-1">
              Built with 😡 and NextJS by <a href="https://emjjkk.tech" target="_blank" rel="noopener noreferrer">@emjjkk</a> & <a href="https://github.com/aiya2007" target="_blank" rel="noopener noreferrer">@aiya2007</a>
            </span>
            <span className="flex items-center gap-1.5 mb-1">
              <a href="https://www.justwatch.com/fr/JustWatch-Streaming-API" target="_blank" rel="noopener noreferrer"><img src="https://lever-client-logos.s3.us-west-2.amazonaws.com/6676c2c2-edaa-4d6b-9c25-8125143c5f13-1609679735246.png" alt="justwatch" className="w-auto h-5" /></a>
              <a href="https://developer.themoviedb.org/docs/getting-started" target="_blank" rel="noopener noreferrer"><img src="https://www.szvisj.com/uploads/allimg/200415/2-200415092044.png" alt="TMDB" className="h-5 w-18 object-cover" /></a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
