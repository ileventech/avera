'use client';
import dynamic from 'next/dynamic';

// react-paystack touches `window` during module evaluation, which crashes
// under SSR — deferred to a client-only dynamic import to avoid that.
const PaymentForm = dynamic(() => import('./PaymentForm'), { ssr: false });

export default function Payment() {
  return <PaymentForm />;
}
