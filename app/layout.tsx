import type { Metadata } from 'next';
import { Outfit, Geist } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { MediaProvider } from '@/context/MediaContext';
import { ModalProvider } from '@/context/ModalContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchOverlay from '@/components/SearchOverlay';
import QuickViewModal from '@/components/QuickViewModal';
import LogWatchedModal from '@/components/LogWatchedModal';
import TrailerModal from '@/components/TrailerModal';
import SocialShareModal from '@/components/SocialShareModal';
import AuthPromptModal from '@/components/AuthPromptModal';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const outfit = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Movie & TV Show Reviews, Watchlists, & Social Diary`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: ['movies', 'TV shows', 'movie reviews', 'watchlist', 'film diary', 'movie recommendations'],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('watchers_theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased flex flex-col selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
        <ThemeProvider>
          <AuthProvider>
            <MediaProvider>
              <ModalProvider>
                <Navbar />
                <main className="flex-1 w-full">{children}</main>
                <Footer />
                <SearchOverlay />
                <QuickViewModal />
                <LogWatchedModal />
                <TrailerModal />
                <SocialShareModal />
                <AuthPromptModal />
              </ModalProvider>
            </MediaProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

