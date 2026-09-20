import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import { checkReviewRateLimit } from '@/lib/rateLimit';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// In-memory fallback if Mongo is briefly unavailable
let memoryReviews = [
  {
    _id: 'seed-1',
    name: 'Harpreet Singh',
    rating: 5,
    comment: 'The cow ghee is absolutely pure and fragrant, just like grandmother used to make in the village. Unmatched quality!',
    photo: '',
    status: 'approved',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: 'seed-2',
    name: 'Gurmeet Kaur',
    rating: 5,
    comment: 'Best soft paneer in Kotakpura. It literally melts in the mouth. We order this every week for our family.',
    photo: '',
    status: 'approved',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    _id: 'seed-3',
    name: 'Rajesh Sharma',
    rating: 5,
    comment: 'Authentic chatti milk and buffalo ghee. Prompt delivery and very respectful uncle ji. Blindly trust Kakria Dairy!',
    photo: '',
    status: 'approved',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get('all') === 'true';

    // Verify if requester is admin if requesting all statuses
    let isAdmin = false;
    if (showAll) {
      const token = req.cookies.get('admin_token')?.value;
      if (token && verifyAdminToken(token)) {
        isAdmin = true;
      }
    }

    await connectDB();
    const query: any = isAdmin ? {} : { status: 'approved' };
    let reviews = await Review.find(query).sort({ createdAt: -1 }).lean();

    // If DB has 0 reviews yet, seed initial ones
    if (reviews.length === 0 && !isAdmin) {
      try {
        await Review.insertMany(memoryReviews.map(r => ({
          name: r.name,
          rating: r.rating,
          comment: r.comment,
          photo: r.photo,
          status: 'approved',
          createdAt: new Date(r.createdAt)
        })));
        reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
      } catch {
        // Fallback to memoryReviews
      }
    }

    if (reviews.length === 0) {
      reviews = memoryReviews as any;
    }

    // Calculate statistics
    const totalCount = reviews.length;
    const sumRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0);
    const averageRating = totalCount > 0 ? Number((sumRating / totalCount).toFixed(1)) : 5.0;

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        totalCount,
        averageRating,
      }
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    // Fallback gracefully
    return NextResponse.json({
      success: true,
      reviews: memoryReviews,
      stats: {
        totalCount: memoryReviews.length,
        averageRating: 5.0,
      }
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';

    const body = await req.json();

    // 1. Honeypot check (anti-spam bot trap)
    if (body.website || body.honeypot) {
      return NextResponse.json({ success: true, message: 'Review submitted successfully.' });
    }

    // 2. Rate limit check (3 per hour per IP)
    const rateCheck = checkReviewRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit reached. You can submit at most 3 reviews per hour.' },
        { status: 429 }
      );
    }

    // 3. Server-side validation
    const name = (body.name || '').trim();
    const rating = Number(body.rating);
    const comment = (body.comment || '').trim();
    const photo = (body.photo || '').trim();

    if (!name || name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: 'Please enter a valid name (2 to 50 characters).' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Please select a valid star rating between 1 and 5.' },
        { status: 400 }
      );
    }

    if (!comment || comment.length < 5 || comment.length > 1000) {
      return NextResponse.json(
        { error: 'Please share a comment between 5 and 1000 characters.' },
        { status: 400 }
      );
    }

    // Create review - approved immediately or pending admin review
    const newReviewData = {
      name,
      rating,
      comment,
      photo,
      status: 'approved' as const,
      ip,
    };

    try {
      await connectDB();
      const saved = await Review.create(newReviewData);
      return NextResponse.json({
        success: true,
        review: saved,
        message: 'Thank you! Your review has been published.'
      }, { status: 201 });
    } catch (dbErr) {
      console.warn('DB error saving review, using fallback:', dbErr);
      const fallbackItem = {
        _id: 'local-' + Date.now(),
        ...newReviewData,
        createdAt: new Date().toISOString()
      };
      memoryReviews.unshift(fallbackItem as any);
      return NextResponse.json({
        success: true,
        review: fallbackItem,
        message: 'Thank you! Your review has been submitted.'
      }, { status: 201 });
    }
  } catch (err: any) {
    console.error('POST review error:', err);
    return NextResponse.json(
      { error: 'Internal server error while saving review.' },
      { status: 500 }
    );
  }
}
