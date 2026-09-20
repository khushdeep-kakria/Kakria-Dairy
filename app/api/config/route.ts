import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  const upiId = process.env.UPI_ID || 'paytmqr2810050501011af4kecs72px@paytm';
  const payeeName = process.env.PAYEE_NAME || 'Kakria Dairy Sweet Shop';
  const uncleWhatsapp = (process.env.UNCLE_WHATSAPP || '919815342224').replace(/\D/g, '');

  return NextResponse.json({
    success: true,
    upiId,
    payeeName,
    merchantCode: '5499',
    uncleWhatsapp: uncleWhatsapp.startsWith('91') ? uncleWhatsapp : '91' + uncleWhatsapp,
    shopPhoneDisplay: '+91 98153 42224',
    shopPhoneTel: '+919815342224',
    shopPhoneWa: '919815342224',
    deliveryTown: 'Kotkapura',
    mapsLink: 'https://maps.app.goo.gl/4A3PC5V43FvNFDDY8',
    fallbackQrImage: '/brand/shop-qr.webp',
  });
}