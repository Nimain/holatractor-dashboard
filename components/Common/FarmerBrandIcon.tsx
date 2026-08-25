"use client";

import React, { useState } from "react";
import Image from "next/image";

interface FarmerBrandIconProps {
  className?: string;
  size?: number | string;
  variant?: "rounded-square" | "transparent" | "pill" | "image";
}

/**
 * HolaTractor Official Brand Logo Icon
 * Uses the exact official red IoT Connected Tractor brand asset.
 */
export default function FarmerBrandIcon({
  className = "",
  size = 40,
  variant = "rounded-square",
}: FarmerBrandIconProps) {
  const [imgError, setImgError] = useState(false);
  const numSize = typeof size === "number" ? size : parseInt(size as string, 10) || 40;

  if (!imgError) {
    return (
      <div
        style={{ width: numSize, height: numSize }}
        className={`relative overflow-hidden rounded-2xl shrink-0 ${className}`}
      >
        <img
          src="/brand/holatractor_logo.jpg"
          alt="HolaTractor Logo"
          className="w-full h-full object-cover rounded-2xl select-none pointer-events-none"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Vector SVG Fallback
  return (
    <svg
      width={numSize}
      height={numSize}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-2xl shrink-0 ${className}`}
    >
      <rect width="512" height="512" rx="110" fill="#E31B23" />
      <g transform="translate(32, 28) scale(0.88)">
        <path
          d="M260 115 C215 115 182 145 168 180"
          stroke="#ffffff"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M255 160 C230 160 210 178 198 202"
          stroke="#ffffff"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="235" cy="225" r="16" fill="#ffffff" />
        <line x1="145" y1="228" x2="115" y2="265" stroke="#ffffff" strokeWidth="24" strokeLinecap="round" />
        <line x1="102" y1="254" x2="135" y2="284" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
        <path
          d="M142 272 L142 305 L310 305 C345 305 375 330 375 365 L375 390"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line x1="245" y1="328" x2="348" y2="328" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" />
        <line x1="290" y1="356" x2="348" y2="356" stroke="#ffffff" strokeWidth="20" strokeLinecap="round" />
        <line x1="228" y1="432" x2="305" y2="432" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
        <circle cx="145" cy="428" r="86" stroke="#ffffff" strokeWidth="24" fill="none" />
        <circle cx="345" cy="445" r="66" stroke="#ffffff" strokeWidth="24" fill="none" />
        <line x1="65" y1="514" x2="145" y2="514" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
        <line x1="240" y1="514" x2="345" y2="514" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" />
      </g>
    </svg>
  );
}
