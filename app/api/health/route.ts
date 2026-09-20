import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { validateEnv } from '@/lib/env';

const startTime = Date.now();

export async function GET() {
  const envCheck = validateEnv();

  let dbStatus = 'disconnected';
  const state = mongoose.connection.readyState;
  switch (state) {
    case 0:
      dbStatus = 'disconnected';
      break;
    case 1:
      dbStatus = 'connected';
      break;
    case 2:
      dbStatus = 'connecting';
      break;
    case 3:
      dbStatus = 'disconnecting';
      break;
    default:
      dbStatus = 'unknown';
  }

  // Attempt brief DB ping if disconnected
  if (state !== 1) {
    try {
      await connectDB();
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : dbStatus;
    } catch {
      // keep current status
    }
  }

  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      uptimeFormatted: `${Math.floor(uptimeSeconds / 60)}m ${uptimeSeconds % 60}s`,
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
      },
      envConfigured: envCheck.valid,
      missingEnv: envCheck.missing,
      memory: process.memoryUsage ? {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      } : undefined,
    },
    { status: 200 }
  );
}
