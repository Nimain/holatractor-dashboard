// In app/(Auth)/verify-otp/page.tsx

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the VerifyOTP component
const VerifyOTP = dynamic(
  () => import('@/components/Authentication/VerifyOTP'), 
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center">
        Loading...
      </div>
    ),
  }
);

const VerifyOTPPage = () => {
  return (
    <VerifyOTP />
  );
};

export default VerifyOTPPage;