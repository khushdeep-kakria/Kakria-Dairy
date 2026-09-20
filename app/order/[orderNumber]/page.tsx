'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MessageCircle,
  ShieldCheck,
  Truck,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Upload,
  FileImage,
  ExternalLink,
  Download,
  Smartphone,
} from 'lucide-react';
import { compressScreenshot } from '@/lib/imageCompressor';
import { formatAddress, buildReceipt, buildWhatsAppLink } from '@/lib/orderUtils';
import { SHOP_PHONE_WA, SHOP_PHONE_DISPLAY } from '@/lib/config';

interface OrderItem {
  productId: string;
  name_en: string;
  name_pa?: string;
  size: string;
  sizeLabel_en: string;
  sizeLabel_pa?: string;
  unitPrice: number;
  quantity: number;
  price: number;
  image: string;
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  altPhone?: string;
  houseStreet?: string;
  areaMohalla?: string;
  landmark?: string;
  city?: string;
  state?: string;
  deliveryAddress: string;
  pincode?: string;
  orderNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status:
    | 'pending_payment'
    | 'verification_pending'
    | 'paid'
    | 'preparing'
    | 'out_for_delivery'
    | 'delivered'
    | 'rejected'
    | 'cancelled';
  screenshotUrl?: string;
  createdAt: string;
}

export default function OrderStatusPage() {
  const params = useParams();
  const { language, t } = useLanguage();
  const orderNumber = (params?.orderNumber as string) || '';

  const [order, setOrder] = useState<OrderData | null>(null);
  const [upiId, setUpiId] = useState<string>('paytmqr2810050501011af4kecs72px@paytm');
  const [payeeName, setPayeeName] = useState<string>('Kakria Dairy Sweet Shop');
  const [showFallbackQr, setShowFallbackQr] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [whatsAppLink, setWhatsAppLink] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');

  // Copy UPI state
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Screenshot Upload & Compression state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [compressing, setCompressing] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');

  // Load public config from server (never hardcode)
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.upiId) setUpiId(cfg.upiId);
        if (cfg.payeeName) setPayeeName(cfg.payeeName);
      })
      .catch(() => {});
  }, []);

  const fetchOrder = useCallback(
    async (isPolling = false) => {
      if (!orderNumber) return;
      try {
        if (!isPolling) setLoading(true);
        const res = await fetch(`/api/orders/${orderNumber}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.upiId) setUpiId(data.upiId);
          if (data.whatsAppLink) setWhatsAppLink(data.whatsAppLink);
          setFetchError('');
        } else {
          if (!isPolling) setFetchError(data.error || 'Order not found');
        }
      } catch (err) {
        if (!isPolling) setFetchError('Failed to load order details');
      } finally {
        if (!isPolling) setLoading(false);
      }
    },
    [orderNumber]
  );

  useEffect(() => {
    fetchOrder(false);
  }, [fetchOrder]);

  // Generate dynamic QR client-side from decoded parameters & server-computed total
  const upiLink = order
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&mc=5499&am=${order.total}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}&tr=${encodeURIComponent(order.orderNumber)}`
    : '';

  useEffect(() => {
    if (!upiLink) return;
    QRCode.toDataURL(upiLink, { width: 280, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate client QR:', err));
  }, [upiLink]);

  // Polling every 10s only while order is not in a terminal state
  useEffect(() => {
    if (!orderNumber || !order) return;
    const isTerminal = ['paid', 'delivered', 'rejected', 'cancelled'].includes(order.status);
    if (isTerminal) return;

    const interval = setInterval(() => {
      fetchOrder(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrder, orderNumber, order?.status]);

  // Handle Copy UPI ID
  const handleCopyUpi = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Handle File Input Change with Browser Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      setCompressedFile(null);
      setPreviewUrl('');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setUploadError('Invalid format. Please select a JPG, PNG, or WebP image.');
      setSelectedFile(null);
      setCompressedFile(null);
      setPreviewUrl('');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15 MB. Please select a smaller screenshot.');
      setSelectedFile(null);
      setCompressedFile(null);
      setPreviewUrl('');
      return;
    }

    setSelectedFile(file);
    try {
      setCompressing(true);
      const compressed = await compressScreenshot(file);
      setCompressedFile(compressed);
      setPreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.warn('Compression fallback to original file:', err);
      setCompressedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  const [waRedirectUrl, setWaRedirectUrl] = useState<string>('');

  // Upload Screenshot with progress tracking & auto-open Uncle's WhatsApp
  const handleUploadScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileToUpload = compressedFile || selectedFile;
    if (!fileToUpload) return;

    setUploading(true);
    setUploadProgress(15);
    setUploadError('');
    setUploadSuccess('');
    setWaRedirectUrl('');

    try {
      const formData = new FormData();
      formData.append('screenshot', fileToUpload);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/orders/${orderNumber}/screenshot`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(95, Math.round((event.loaded / event.total) * 100));
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setUploadProgress(100);
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            // Build receipt from saved order, ensuring all customer and item data is preserved
            const savedOrder: OrderData = {
              ...(order || {}),
              ...(data.order || {}),
              status: 'verification_pending',
              screenshotUrl: data.screenshotUrl || data.order?.screenshotUrl || order?.screenshotUrl,
            } as OrderData;
            setOrder(savedOrder);

            const receiptText = buildReceipt(savedOrder as any);
            const targetUrl = `https://wa.me/${SHOP_PHONE_WA}?text=${encodeURIComponent(receiptText)}`;
            setWaRedirectUrl(targetUrl);

            const successMsg =
              language === 'pa'
                ? 'ਆਰਡਰ ਦਰਜ ਹੋ ਗਿਆ ✅। WhatsApp ਖੁੱਲ੍ਹ ਰਹੀ ਹੈ: Send ਦਬਾਓ ਅਤੇ ਆਪਣਾ ਪੇਮੈਂਟ ਸਕ੍ਰੀਨਸ਼ਾਟ ਭੇਜੋ'
                : 'Order placed ✅. WhatsApp is opening: tap Send and attach your payment screenshot';
            setUploadSuccess(successMsg);

            // Automatic navigation to Uncle's WhatsApp after 2 seconds
            setTimeout(() => {
              window.location.assign(targetUrl);
            }, 2000);

            fetchOrder(true);
          } else {
            setUploadError(data.error || 'Upload failed. Please try again.');
          }
        } catch {
          setUploadError('Invalid response from server.');
        } finally {
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadError('Network error uploading screenshot.');
        setUploading(false);
      };

      xhr.send(formData);
    } catch {
      setUploadError('Network error uploading screenshot.');
      setUploading(false);
    }
  };

  // Dedicated direct WhatsApp share handler: downloads screenshot & opens Uncle's WhatsApp with receipt
  const handleShareReceipt = () => {
    if (!order) return;
    const targetUrl = whatsAppLink || buildWhatsAppLink(order);

    // Auto-save screenshot so user has it ready to attach in WhatsApp
    if (previewUrl || order.screenshotUrl) {
      try {
        const a = document.createElement('a');
        a.href = previewUrl || order.screenshotUrl || '';
        a.download = `payment-screenshot-${order.orderNumber}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.warn('Screenshot download error:', e);
      }
    }

    // Direct WhatsApp navigation to Uncle
    window.open(targetUrl, '_blank') || window.location.assign(targetUrl);
  };

  // Send on WhatsApp handler (fresh user tap)
  const handleSendWhatsApp = async () => {
    if (!order) return;
    const receiptText = buildReceipt(order);

    // Copy receipt to clipboard
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(receiptText);
        setCopiedReceipt(true);
        setTimeout(() => setCopiedReceipt(false), 3000);
      } catch {}
    }

    // Direct WhatsApp navigation via window.location.assign (prevents popup blocking)
    const targetUrl = whatsAppLink || buildWhatsAppLink(order);
    window.location.assign(targetUrl);
  };

  const handleDownloadScreenshot = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `kakria-dairy-screenshot-${order?.orderNumber || 'receipt'}.jpg`;
      a.click();
    } else if (order?.screenshotUrl) {
      window.open(order.screenshotUrl, '_blank');
    }
  };

  if (loading && !order) {
    return (
      <div className="py-24 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 border-4 border-dairy-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-serif text-lg font-bold text-dairy-green">Loading Order Details…</p>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="py-20 px-4 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-dairy-text">Order Not Found</h2>
        <p className="text-sm text-dairy-muted">
          {fetchError || 'We could not find an order with this link.'}
        </p>
        <Link
          href="/categories"
          className="inline-block px-6 py-3 rounded-xl bg-dairy-green text-white font-bold text-sm shadow-md"
        >
          Browse Dairy Catalog
        </Link>
      </div>
    );
  }

  const isPending = order.status === 'pending_payment';
  const isVerifying = order.status === 'verification_pending';
  const isPaid = order.status === 'paid';
  const isPreparing = order.status === 'preparing';
  const isOut = order.status === 'out_for_delivery';
  const isDelivered = order.status === 'delivered';
  const isRejected = order.status === 'rejected';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* ── Status Banner (Live Polling every 10s while pending) ────────────── */}
      <div className="rounded-3xl p-6 sm:p-8 text-center text-white shadow-dairy space-y-3 transition-all">
        {isPending && (
          <div className="bg-amber-600 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">
              {language === 'en' ? 'Scan Dynamic UPI QR to Pay' : 'ਭੁਗਤਾਨ ਬਾਕੀ — ਸਕੈਨ ਕਰਕੇ ਪੇ ਕਰੋ'}
            </h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              {language === 'en'
                ? `Please pay ₹${order.total} using any UPI app, then upload your payment screenshot below.`
                : `ਕਿਰਪਾ ਕਰਕੇ ₹${order.total} ਦਾ UPI ਭੁਗਤਾਨ ਕਰੋ ਅਤੇ ਹੇਠਾਂ ਸਕਰੀਨਸ਼ਾਟ ਅਪਲੋਡ ਕਰੋ।`}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/20 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-refreshing status every 10s</span>
            </div>
          </div>
        )}

        {isVerifying && (
          <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">
              {language === 'en' ? 'Payment Verification Pending' : 'ਭੁਗਤਾਨ ਦੀ ਪੁਸ਼ਟੀ ਹੋ ਰਹੀ ਹੈ'}
            </h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              {language === 'en'
                ? 'Your payment screenshot has been submitted. Our team at Kakria Dairy is verifying the transaction.'
                : 'ਭੁਗਤਾਨ ਦਾ ਸਕਰੀਨਸ਼ਾਟ ਮਿਲ ਗਿਆ ਹੈ। ਸਾਡੀ ਟੀਮ ਪੁਸ਼ਟੀ ਕਰ ਰਹੀ ਹੈ।'}
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/20 text-xs font-semibold">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Auto-refreshing every 10s</span>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="bg-emerald-700 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">
              {language === 'en' ? 'Payment Verified & Confirmed! ✅' : 'ਭੁਗਤਾਨ ਪੱਕਾ ਹੋ ਗਿਆ ਹੈ! ✅'}
            </h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              {language === 'en'
                ? 'Your payment has been verified by Kakria Dairy. We are preparing your fresh dairy order.'
                : 'ਤੁਹਾਡੇ ਭੁਗਤਾਨ ਦੀ ਪੁਸ਼ਟੀ ਹੋ ਗਈ ਹੈ। ਆਰਡਰ ਤਿਆਰ ਕੀਤਾ ਜਾ ਰਿਹਾ ਹੈ।'}
            </p>
          </div>
        )}

        {isPreparing && (
          <div className="bg-dairy-green rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">Preparing Fresh Dairy Batch</h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              Freshly made in Kotkapura with guaranteed 100% purity.
            </p>
          </div>
        )}

        {isOut && (
          <div className="bg-teal-700 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8 animate-bounce" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">Out for Delivery 🚚</h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              Our delivery person is on the way to your Kotkapura address.
            </p>
          </div>
        )}

        {isDelivered && (
          <div className="bg-emerald-800 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">Delivered! Enjoy Pure Dairy 🙏</h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              Thank you for trusting Kakria Dairy (Since 2002 by DKK).
            </p>
          </div>
        )}

        {isRejected && (
          <div className="bg-rose-700 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">Payment Verification Rejected</h1>
            <p className="text-sm font-medium text-white/90 max-w-xl mx-auto">
              Please re-upload a clear screenshot of your completed UPI transaction below.
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-stone-700 rounded-2xl p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black">Order Cancelled</h1>
          </div>
        )}
      </div>

      {/* ── Dynamic UPI QR Code & Compulsory Screenshot Upload ───────────────── */}
      {(isPending || isRejected || Boolean(uploadSuccess)) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border shadow-dairy space-y-8">
          {/* Step 1: Scan QR */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dairy-green/10 text-dairy-green text-xs font-bold">
              <QrCode className="w-3.5 h-3.5 text-dairy-gold" />
              <span>Step 1: Scan Dynamic QR with Any UPI App</span>
            </span>
            <h2 className="font-serif text-2xl font-black text-dairy-green-dark">
              Pay ₹{order.total} via UPI
            </h2>
            <p className="text-xs sm:text-sm text-dairy-muted">
              Amount and Order Number #{order.orderNumber} are automatically encoded in this QR.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
            {qrDataUrl ? (
              <div className="p-4 bg-white rounded-2xl border-4 border-dairy-green/30 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`UPI QR for ${order.orderNumber}`}
                  width={240}
                  height={240}
                  className="rounded-lg"
                />
              </div>
            ) : (
              <div className="w-60 h-60 bg-dairy-cream rounded-xl flex items-center justify-center animate-pulse">
                <QrCode className="w-12 h-12 text-dairy-muted" />
              </div>
            )}

            {/* Total Badge */}
            <div className="px-6 py-2 rounded-2xl bg-dairy-green text-white font-black text-2xl shadow-md">
              ₹{order.total}
            </div>

            {/* Collapsible Shop QR Fallback */}
            <div className="w-full max-w-sm border border-dairy-border/90 rounded-2xl overflow-hidden bg-dairy-cream/30">
              <button
                type="button"
                onClick={() => setShowFallbackQr(!showFallbackQr)}
                className="w-full py-2.5 px-4 text-xs font-bold text-dairy-green flex items-center justify-between hover:bg-dairy-cream transition-colors"
              >
                <span>{showFallbackQr ? '▲ Hide shop QR' : '▼ QR not working? Pay using shop QR'}</span>
              </button>
              {showFallbackQr && (
                <div className="p-4 pt-2 text-center space-y-2.5 border-t border-dairy-border/50 bg-white">
                  <div className="relative w-52 h-52 mx-auto rounded-xl overflow-hidden border border-dairy-border shadow-sm">
                    <Image
                      src="/brand/shop-qr.webp"
                      alt="Shop Payment QR Scanner"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-dairy-maroon bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-snug">
                    ⚠️ Note: Amount is not pre-encoded on the physical shop QR. Please type the exact total (₹{order.total}) manually in your UPI app.
                  </p>
                </div>
              )}
            </div>

            {/* UPI ID with Copy Button */}
            <div className="flex items-center gap-2 p-2.5 px-4 rounded-xl bg-dairy-cream border border-dairy-border text-xs">
              <span className="text-dairy-muted font-medium">UPI ID:</span>
              <span className="font-mono font-bold text-dairy-green">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="ml-2 px-2.5 py-1 rounded-lg bg-white border border-dairy-border hover:bg-dairy-green hover:text-white font-bold flex items-center gap-1 transition-colors"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Compulsory Screenshot Upload */}
          <div className="border-t border-dairy-border/80 pt-6 space-y-4">
            <div className="text-center space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-dairy-gold/20 text-dairy-green text-xs font-bold">
                Step 2: Upload Payment Screenshot (Compulsory)
              </span>
              <h3 className="font-serif text-lg font-bold text-dairy-green">
                Attach Payment Screenshot
              </h3>
              <p className="text-xs text-dairy-muted">
                Take a screenshot of your successful UPI payment from GPay, PhonePe, or Paytm and upload it below. Auto-compressed for fast upload.
              </p>
            </div>

            <form onSubmit={handleUploadScreenshot} className="max-w-md mx-auto space-y-4">
              <div className="border-2 border-dashed border-dairy-green/40 hover:border-dairy-green rounded-2xl p-5 text-center cursor-pointer bg-dairy-cream/20 transition-all">
                <input
                  type="file"
                  id="screenshotInput"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="screenshotInput" className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-dairy-green mx-auto" />
                  <p className="text-xs font-bold text-dairy-text">
                    {selectedFile ? selectedFile.name : 'Click to select screenshot (JPG, PNG, WebP)'}
                  </p>
                  <p className="text-[11px] text-dairy-muted">
                    {compressing ? 'Compressing image…' : 'Max file size: 15 MB (auto-compressed)'}
                  </p>
                </label>
              </div>

              {previewUrl && (
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-dairy-green">Preview:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Screenshot Preview"
                    className="max-h-48 mx-auto rounded-xl border border-dairy-border shadow-sm object-contain"
                  />
                </div>
              )}

              {uploadError && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 text-center">
                  {uploadError}
                </p>
              )}

              {uploadSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-center space-y-3 shadow-sm animate-fadeIn">
                  <p className="text-xs sm:text-sm font-black text-emerald-800 leading-snug">
                    {uploadSuccess}
                  </p>
                  {waRedirectUrl && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                      <a
                        href={waRedirectUrl || (order ? buildWhatsAppLink(order) : `https://wa.me/${SHOP_PHONE_WA}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5e] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Open WhatsApp</span>
                      </a>
                      <a
                        href={waRedirectUrl || (order ? buildWhatsAppLink(order) : `https://wa.me/${SHOP_PHONE_WA}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleShareReceipt}
                        className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white hover:bg-dairy-cream text-dairy-green border border-dairy-green/40 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Share Screenshot + Receipt</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {uploading && (
                <div className="space-y-1.5 p-3 rounded-xl bg-dairy-cream/60 border border-dairy-border animate-fadeIn">
                  <div className="w-full bg-dairy-cream-dark rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-dairy-green h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-dairy-green font-bold text-center">
                    Compressing & Uploading: {uploadProgress}%
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || uploading || compressing}
                className="w-full py-3.5 px-4 rounded-xl bg-dairy-green hover:bg-dairy-green-dark text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {uploading ? (
                  <span>Uploading Screenshot…</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-dairy-gold" />
                    <span>Upload Screenshot & Submit for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Dedicated Send on WhatsApp Section (Fresh User Tap) ─────────────── */}
      {(isVerifying || isPaid || order.screenshotUrl || uploadSuccess) && (
        <div className="bg-[#25D366]/10 border-2 border-[#25D366]/40 rounded-2xl p-6 space-y-4 text-center">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#128C7E]">
              📲 Send Receipt on WhatsApp to Kakria Dairy
            </h3>
            <p className="text-xs text-dairy-muted max-w-lg mx-auto">
              Tap below to send your itemized receipt and payment screenshot to <span className="font-bold text-dairy-text">{SHOP_PHONE_DISPLAY}</span> for expedited preparation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={whatsAppLink || (order ? buildWhatsAppLink(order) : `https://wa.me/${SHOP_PHONE_WA}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebe5e] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp</span>
            </a>

            <a
              href={whatsAppLink || (order ? buildWhatsAppLink(order) : `https://wa.me/${SHOP_PHONE_WA}`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShareReceipt}
              className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-white hover:bg-dairy-cream text-dairy-green border border-dairy-green/40 font-bold text-xs shadow-sm transition-all min-h-[44px]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Share Screenshot + Receipt</span>
            </a>

            {(previewUrl || order.screenshotUrl) && (
              <button
                type="button"
                onClick={handleDownloadScreenshot}
                className="inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-white hover:bg-dairy-cream text-dairy-green border border-dairy-green/40 font-bold text-xs shadow-sm transition-all min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Download Screenshot</span>
              </button>
            )}
          </div>

          {copiedReceipt && (
            <p className="text-xs text-[#128C7E] font-semibold animate-fadeIn">
              ✅ Receipt text copied to clipboard! You can paste it into WhatsApp.
            </p>
          )}
        </div>
      )}

      {/* ── Order Receipt Card ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-dairy-border/80 shadow-dairy space-y-6">
        {/* Unmissable Bold Payment Status Banner at the top of receipt */}
        <div
          className={`p-4 rounded-2xl text-center font-serif text-sm sm:text-base font-black uppercase tracking-wide border ${
            isPaid
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : isVerifying
              ? 'bg-blue-50 text-blue-800 border-blue-300'
              : isRejected
              ? 'bg-rose-50 text-rose-800 border-rose-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}
        >
          {isPaid && 'PAYMENT STATUS: PAID (via UPI QR)'}
          {isVerifying && 'PAYMENT STATUS: VERIFICATION PENDING (Admin review in progress)'}
          {isRejected && 'PAYMENT STATUS: REJECTED (Please re-upload payment screenshot)'}
          {isPending && `PAYMENT STATUS: PENDING PAYMENT (Unpaid — Scan QR & Pay ₹${order.total})`}
          {!isPaid && !isVerifying && !isRejected && !isPending && `PAYMENT STATUS: ${order.status.replace(/_/g, ' ')}`}
        </div>

        {/* Header with Logo and Order Number */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dairy-border/70 pb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image src="/images/logo.svg" alt="Kakria Dairy" fill className="object-contain" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-dairy-green">{t('brand_name')}</h3>
              <p className="text-[11px] text-dairy-muted">{t('tagline')}</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs space-y-0.5">
            <p className="font-mono font-bold text-dairy-text">Order #{order.orderNumber}</p>
            <p className="text-dairy-muted">
              {new Date(order.createdAt).toLocaleString(language === 'pa' ? 'pa-IN' : 'en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-dairy-cream/40 p-4 rounded-2xl border border-dairy-border/60">
          <div>
            <p className="font-bold text-dairy-green mb-1">Customer & Delivery</p>
            <p className="font-semibold text-dairy-text">{order.customerName}</p>
            <p className="text-dairy-muted font-medium mt-0.5">{formatAddress(order)}</p>
            <p className="text-dairy-muted mt-1">Phone: {order.customerPhone}</p>
            {order.altPhone && <p className="text-dairy-muted">Alt. Phone: {order.altPhone}</p>}
            {order.orderNotes && <p className="text-dairy-muted italic mt-1">Note: {order.orderNotes}</p>}
          </div>

          <div>
            <p className="font-bold text-dairy-green mb-1">Payment Details</p>
            <p className="font-mono font-bold text-sm uppercase text-dairy-green-dark">
              Method: UPI QR ({order.screenshotUrl ? 'Screenshot Attached ✅' : 'Pending Screenshot'})
            </p>
            <p className="text-dairy-muted text-[11px] mt-1">
              Shop WhatsApp: {SHOP_PHONE_DISPLAY}
            </p>
            {order.screenshotUrl && (
              <a
                href={order.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-dairy-green font-bold hover:underline"
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>View Uploaded Screenshot</span>
              </a>
            )}
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm font-bold text-dairy-green border-b border-dairy-border/50 pb-2">
            Items Ordered
          </h4>
          <div className="divide-y divide-dairy-border/40 text-xs">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-dairy-text">
                    {language === 'en' ? item.name_en : item.name_pa || item.name_en}
                  </span>
                  <span className="text-dairy-muted ml-2">
                    ({language === 'en' ? item.sizeLabel_en : item.sizeLabel_pa || item.sizeLabel_en})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-dairy-muted font-mono">×{item.quantity}</span>
                  <span className="font-bold text-dairy-green min-w-[50px] text-right">
                    ₹{item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 pt-3 border-t border-dairy-border text-xs sm:text-sm">
          <div className="flex justify-between text-dairy-muted">
            <span>Subtotal</span>
            <span className="font-bold text-dairy-text">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-dairy-muted">
            <span>Delivery Fee</span>
            <span className="font-bold text-dairy-text">
              {order.deliveryFee === 0 ? 'FREE (Kotkapura Town)' : `₹${order.deliveryFee}`}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-dairy-maroon font-bold">
              <span>Savings</span>
              <span>-₹{order.discount}</span>
            </div>
          )}
          <div className="pt-3 border-t border-dairy-border flex items-baseline justify-between font-serif">
            <span className="text-base font-bold text-dairy-green-dark">Total Amount</span>
            <span className="text-2xl font-black text-dairy-green">₹{order.total}</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-2">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-xs font-bold text-dairy-green hover:underline min-h-[44px]"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
