'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Star, MessageSquarePlus, CheckCircle, AlertCircle, Trash2, Eye, EyeOff, Camera, X } from 'lucide-react';
import { compressScreenshot } from '@/lib/imageCompressor';

interface ReviewItem {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  photo?: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: string;
}

export default function ReviewsSection() {
  const { language, t } = useLanguage();
  const { isAdmin } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ averageRating: 5.0, totalCount: 0 });

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchReviews = async () => {
    try {
      const url = isAdmin ? '/api/reviews?all=true' : '/api/reviews';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [isAdmin]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'Original file is larger than 10MB.' });
      return;
    }

    try {
      // Client-side compress photo to max 1280px, jpeg 0.7
      const compressed = await compressScreenshot(file);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      setFeedback({ type: 'error', message: 'Please provide both your name and comment.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      let uploadedPhotoUrl = '';

      // Upload photo if present
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const upRes = await fetch('/api/reviews/upload', {
          method: 'POST',
          body: formData,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          uploadedPhotoUrl = upData.url;
        }
      }

      const payload = {
        name: name.trim(),
        rating,
        comment: comment.trim(),
        photo: uploadedPhotoUrl,
        website: honeypot, // anti-spam bot trap
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: t('review_success') });
        setName('');
        setComment('');
        setRating(5);
        removePhoto();
        setTimeout(() => {
          setFormOpen(false);
          setFeedback(null);
        }, 2500);
        fetchReviews();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Could not submit review.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin moderation actions
  const handleStatusChange = async (id: string, status: 'approved' | 'hidden') => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  return (
    <section id="reviews" className="py-14 sm:py-20 bg-dairy-cream/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-dairy-border/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dairy-gold/15 text-dairy-maroon text-xs font-bold tracking-wide uppercase">
              <Star className="w-3.5 h-3.5 fill-dairy-gold text-dairy-gold" />
              <span>{t('brand_name')} Community</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-dairy-green-dark">
              {t('reviews_title')}
            </h2>
            <p className="text-sm text-dairy-text/75 max-w-xl">
              {t('reviews_subtitle')}
            </p>
          </div>

          {/* Rating Summary & Action Button */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-dairy-border/80 shadow-sm">
              <div className="text-2xl sm:text-3xl font-black text-dairy-green-dark">
                {stats.averageRating}
              </div>
              <div>
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(stats.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-[11px] font-semibold text-dairy-muted">
                  {stats.totalCount} {t('total_reviews')}
                </div>
              </div>
            </div>

            <button
              onClick={() => setFormOpen(!formOpen)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{t('leave_review')}</span>
            </button>
          </div>
        </div>

        {/* Leave a Review Expandable Form */}
        {formOpen && (
          <div className="mb-12 bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border shadow-dairy animate-fadeIn">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-dairy-green-dark">
                {t('leave_review')}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`mb-5 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot anti-spam trap */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Author Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dairy-text uppercase tracking-wider">
                    {t('review_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    placeholder="e.g. Jaspreet Singh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-dairy-border bg-dairy-cream/30 text-dairy-text focus:outline-none focus:ring-2 focus:ring-dairy-green text-sm"
                  />
                </div>

                {/* Interactive Star Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-dairy-text uppercase tracking-wider">
                    {t('review_rating')} *
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-zinc-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-dairy-muted ml-2">
                      {rating} / 5
                    </span>
                  </div>
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dairy-text uppercase tracking-wider">
                  {t('review_comment')} *
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  placeholder="Share your honest thoughts on the aroma, taste, and freshness..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-dairy-border bg-dairy-cream/30 text-dairy-text focus:outline-none focus:ring-2 focus:ring-dairy-green text-sm resize-none"
                />
              </div>

              {/* Optional Photo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-dairy-text uppercase tracking-wider">
                  {t('review_photo')} (Max 3MB, Auto-Compressed)
                </label>
                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-dairy-border">
                      <Image
                        src={photoPreview}
                        alt="Upload preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50"
                    >
                      Remove Photo
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-dairy-border bg-dairy-cream/20 hover:bg-dairy-cream-dark cursor-pointer transition-colors text-xs font-bold text-dairy-text/80">
                    <Camera className="w-4 h-4 text-dairy-green" />
                    <span>Attach Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-bold text-sm shadow transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : t('review_submit')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-3xl bg-dairy-cream-dark/60 animate-pulse"
              />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dairy-border">
            <p className="text-sm font-medium text-dairy-muted">
              {t('no_reviews')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className={`bg-white rounded-3xl p-6 border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                  rev.status === 'hidden'
                    ? 'border-zinc-300 opacity-60'
                    : 'border-dairy-border/80'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Name + Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-bold text-base text-dairy-text">
                        {rev.name}
                      </h4>
                      <p className="text-[11px] text-dairy-muted">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400' : 'text-zinc-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-dairy-text/80 leading-relaxed italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  {/* Attached photo thumbnail */}
                  {rev.photo && (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden mt-2 border border-dairy-border">
                      <Image
                        src={rev.photo}
                        alt={`Photo by ${rev.name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Admin Mode Moderation Bar */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-dairy-border/60 flex items-center justify-between text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rev.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rev.status === 'hidden'
                          ? 'bg-zinc-200 text-zinc-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rev.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {rev.status !== 'approved' && (
                        <button
                          onClick={() => handleStatusChange(rev._id, 'approved')}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 title='Approve'"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {rev.status !== 'hidden' && (
                        <button
                          onClick={() => handleStatusChange(rev._id, 'hidden')}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 title='Hide'"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rev._id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 title='Delete'"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
