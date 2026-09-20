'use client';

import { useEffect, useState } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { Bell, CheckCircle2, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ActivityItem, fetchFollowingActivityDB } from '@/lib/supabase';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function NotificationsView() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchFollowingActivityDB(user.id).then(setActivity).finally(() => setIsLoading(false));
  }, [user]);

  if (isAuthLoading || isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-zinc-500 animate-pulse">Loading notifications...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-xl font-regular text-zinc-900 dark:text-zinc-100">Sign in to see updates</h1>
        <p className="text-sm text-zinc-500">Follow people to keep up with their reviews and watched titles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-regular text-zinc-900 dark:text-zinc-50">Notifications</h1>
          <p className="text-sm text-zinc-500">Recent activity from people you follow.</p>
        </div>
      </div>

      {activity.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
          <Bell className="w-8 h-8 mx-auto text-zinc-400" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Nothing new yet</p>
          <p className="text-xs text-zinc-500">When someone you follow reviews or watches a title, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activity.map(item => (
            <article key={item.id} className="flex gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <Link href={`/profile/${item.username}`} className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                {item.user_avatar ? <Image src={item.user_avatar} alt={item.username} fill className="object-cover" referrerPolicy="no-referrer" /> : null}
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                  {item.type === 'review' ? <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  <Link href={`/profile/${item.username}`} className="font-bold hover:underline">{item.display_name || item.username}</Link>
                  <span className="text-zinc-500">{item.type === 'review' ? 'reviewed' : 'watched'}</span>
                </div>
                <Link href={`/${item.media_type}/${item.media_id}`} className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400">{item.media_title}</Link>
                {item.type === 'review' && item.content ? <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">{item.content}</p> : null}
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  {item.rating ? <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {item.rating}/5</span> : null}
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
