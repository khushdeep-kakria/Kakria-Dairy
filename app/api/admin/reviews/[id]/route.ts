import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function checkAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token || !verifyAdminToken(token)) {
    return false;
  }
  return true;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!['approved', 'hidden', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();
    const updated = await Review.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      review: updated,
      message: `Review status updated to ${status}.`
    });
  } catch (error: any) {
    console.error('Admin review PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update review status.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const { id } = params;
    await connectDB();
    await Review.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Review permanently deleted.'
    });
  } catch (error: any) {
    console.error('Admin review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review.' }, { status: 500 });
  }
}
