import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminModel } from '@/models/Admin';
import { comparePassword, signAdminToken, setAdminCookie } from '@/lib/auth';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/rateLimit';
import { ensureDbInitialized } from '@/lib/dbInit';

export async function POST(req: NextRequest) {
  try {
    // 1. IP rate limiting (5 attempts / 15 minutes)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateCheck = checkLoginRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please try again after ${rateCheck.retryAfterSeconds || 900} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    let dbAvailable = false;
    let admin: any = null;
    try {
      await ensureDbInitialized();
      await connectToDatabase();
      dbAvailable = true;
      admin = await AdminModel.findOne({ username: cleanUsername });
    } catch (e) {
      console.warn('[Admin Login] DB unavailable, verifying against process.env credentials:', (e as Error).message);
    }

    const envAdminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const envAdminPass = process.env.ADMIN_PASSWORD || 'adminpassword123';

    let isValid = false;

    if (dbAvailable && admin) {
      isValid = await comparePassword(password, admin.passwordHash);
    } else if (cleanUsername === envAdminUser) {
      isValid = password === envAdminPass;
    }

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid username or password.',
          remainingAttempts: rateCheck.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Success! Reset rate limit
    resetLoginRateLimit(ip);

    const token = signAdminToken(cleanUsername);
    const res = NextResponse.json({
      success: true,
      message: 'Login successful.',
      admin: { username: cleanUsername },
    });

    setAdminCookie(res, token);
    return res;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Login failed.' },
      { status: 500 }
    );
  }
}
