'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from '@/components/RemoteImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  AtSign,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  ExternalLink,
  Globe,
  Cloud,
} from 'lucide-react';

const PRESET_AVATARS = [
  {
    name: 'Cinephile Classic',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Director Film',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Neon Cinema',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Studio Master',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Retro Reel',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Art House',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Midnight Movie',
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Indie Enthusiast',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
];

export default function SettingsPage() {
  const { user, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');
  
  const [isUploadingImgBB, setIsUploadingImgBB] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize form fields with current user
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
      setAvatarPreview(user.avatar_url || '');
      setBannerImage(user.banner_image || '');
      setBannerPreview(user.banner_image || '');
    }
  }, [user]);

  const handleAvatarUrlChange = (url: string) => {
    setAvatarUrl(url);
    setAvatarPreview(url);
  };

  const handleBannerUrlChange = (url: string) => {
    setBannerImage(url);
    setBannerPreview(url);
  };

  // Upload image to ImgBB via our secure API route
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 16MB for ImgBB)
    if (file.size > 16 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 16MB.');
      return;
    }

    // Immediate temporary local preview while uploading
    const localPreview = URL.createObjectURL(file);
    setAvatarPreview(localPreview);
    setIsUploadingImgBB(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || 'Failed to upload image to ImgBB. Please try again.'
        );
      }

      const hostedUrl = data.url;
      setAvatarUrl(hostedUrl);
      setAvatarPreview(hostedUrl);
      setSuccessMsg('Profile picture uploaded to ImgBB successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error uploading image to ImgBB.');
      // Revert preview back to existing avatar URL if upload failed
      if (avatarUrl) {
        setAvatarPreview(avatarUrl);
      }
    } finally {
      setIsUploadingImgBB(false);
      // Reset file input so user can re-select the same file if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 16MB.');
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setBannerPreview(localPreview);
    setIsUploadingImgBB(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to upload banner image.');
      setBannerImage(data.url);
      setBannerPreview(data.url);
      setSuccessMsg('Profile banner uploaded to ImgBB successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error uploading banner image.');
      setBannerPreview(bannerImage);
    } finally {
      setIsUploadingImgBB(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRandomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const generated = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
    handleAvatarUrlChange(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      setErrorMsg('Username cannot be empty and can only contain letters, numbers, and underscores.');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const finalAvatar = avatarUrl.trim();
      const finalBanner = bannerImage.trim();
      const finalDisplayName = displayName.trim() || cleanUsername;
      const finalBio = bio.trim();

      const success = await updateProfile({
        username: cleanUsername,
        display_name: finalDisplayName,
        bio: finalBio,
        avatar_url: finalAvatar,
        banner_image: finalBanner,
      });

      if (success) {
        setSuccessMsg('Profile settings updated successfully!');
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg('Failed to update profile. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400 mb-2" />
        <p className="text-sm text-zinc-500">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-4 shadow-xl">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Sign in required</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          You must be logged in to manage your profile and account settings.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  const isImgBBHosted = avatarUrl.includes('ibb.co') || avatarPreview.includes('ibb.co');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your public identity, ImgBB-hosted profile and banner images, display name, and bio.
          </p>
        </div>

        <Link
          href={`/profile/${user.username}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors self-start sm:self-auto"
        >
          <span>View Public Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Notifications */}
      <div className="my-6 space-y-3">
        {successMsg && (
          <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Section 2: Personal Identity */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Personal Information
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Live Avatar Preview */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 shadow-inner group">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Profile Avatar Preview"
                  fill
                  className={`object-cover transition-opacity ${isUploadingImgBB ? 'opacity-40' : 'opacity-100'}`}
                  unoptimized={avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:')}
                  referrerPolicy="no-referrer"
                  onError={() => {
                    setAvatarPreview('');
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <User className="w-10 h-10" />
                </div>
              )}

              {/* Uploading overlay */}
              {isUploadingImgBB && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-[11px] font-semibold gap-1">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>

            {/* Custom URL & ImgBB Upload options */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="avatar-url-input"
                  className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Avatar Image URL <span className="font-normal text-zinc-400">(ImgBB, Unsplash, or direct image link)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="avatar-url-input"
                    type="url"
                    value={avatarUrl.startsWith('blob:') ? '' : avatarUrl}
                    onChange={(e) => handleAvatarUrlChange(e.target.value)}
                    placeholder="https://i.ibb.co/... or https://..."
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* ImgBB File Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  id="btn-upload-imgbb"
                  disabled={isUploadingImgBB}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {isUploadingImgBB ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                      <span>Uploading</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>Upload from Computer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <div>
              <label htmlFor="banner-image-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Profile Banner Image
              </label>
              <p className="text-[11px] text-zinc-400 mt-1">Choose a wide image for the top of your public profile.</p>
            </div>
            <div className="relative h-36 sm:h-44 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
              {bannerPreview ? (
                <Image
                  src={bannerPreview}
                  alt="Profile banner preview"
                  fill
                  className="object-cover"
                  unoptimized={bannerPreview.startsWith('blob:') || bannerPreview.startsWith('data:')}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">No banner selected</div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="banner-image-input"
                type="url"
                value={bannerImage.startsWith('blob:') ? '' : bannerImage}
                onChange={(e) => handleBannerUrlChange(e.target.value)}
                placeholder="https://i.ibb.co/... or https://..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingImgBB}
                onClick={() => bannerInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5 text-blue-500" />
                Upload Banner
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Display Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="settings-displayname"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="settings-displayname"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Cinematic"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Your visible public name on reviews, comments, and profile page.
              </p>
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="settings-username"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  id="settings-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="alex_cinema"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Unique handle: <span className="font-mono text-zinc-600 dark:text-zinc-300">/profile/{username || 'username'}</span>
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="settings-bio"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Bio / About Me
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">
                {bio.length}/250
              </span>
            </div>
            <div className="relative">
              <textarea
                id="settings-bio"
                rows={3}
                maxLength={250}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the Weflixd community about your taste in films, favorite directors, or current cinema watchlist..."
                className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Account Overview */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <Shield className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Account Metadata
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 block">Sign-in Method</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                {user.provider || 'Email / Password'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Member Since</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block">Account Status</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Verified Active
              </span>
            </div>
          </div>
        </div>

        {/* Save Changes Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href={`/profile/${user.username}`}
            className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            id="btn-save-settings"
            disabled={isSaving || isUploadingImgBB}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
