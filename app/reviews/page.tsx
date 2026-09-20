import React from 'react';
import { Metadata } from 'next';
import ReviewsSection from '@/components/ReviewsSection';

export const metadata: Metadata = {
  title: 'Customer Reviews | Kakria Dairy — Since 2002 by DKK',
  description: 'Read genuine reviews and experiences from our customers who trust Kakria Dairy for pure desi ghee, paneer, and chatti milk in Kotakpura.',
};

export default function ReviewsPage() {
  return (
    <div className="min-h-screen py-6">
      <ReviewsSection />
    </div>
  );
}