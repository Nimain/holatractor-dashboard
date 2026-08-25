"use client";

import React from "react";

interface FarmerBrandIconProps {
  className?: string;
  size?: number | string;
  variant?: "rounded-square" | "transparent" | "pill" | "image";
}

/**
 * HolaTractor Official Brand Logo Icon
 * Signature Electric Red (#E31B23) with white IoT connected tractor silhouette.
 */
export default function FarmerBrandIcon({
  className = "",
  size = 40,
  variant = "rounded-square",
}: FarmerBrandIconProps) {
  const isTransparent = variant === "transparent";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Official HolaTractor Electric Red Gradient */}
        <linearGradient id="holaRedBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EB2028" />
          <stop offset="50%" stopColor="#E31B23" />
          <stop offset="100%" stopColor="#C9141B" />
        </linearGradient>

        <linearGradient id="holaGlowHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── BACKGROUND CONTAINER ── */}
      {!isTransparent && (
        <>
          <rect
            width="512"
            height="512"
            rx="110"
            fill="url(#holaRedBgGradient)"
          />
          <rect
            width="512"
            height="256"
            rx="110"
            fill="url(#holaGlowHighlight)"
          />
        </>
      )}

      {/* ── WHITE CONNECTED IoT TRACTOR ── */}
      <g transform="translate(32, 28) scale(0.88)">
        {/* 1. IoT Wi-Fi / Radio Waves & Connected Beacon */}
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
        {/* Beacon Signal Center Dot */}
        <circle cx="235" cy="225" r="16" fill="#ffffff" />

        {/* 2. Tractor Steering Column & Wheel */}
        <line
          x1="145"
          y1="228"
          x2="115"
          y2="265"
          stroke="#ffffff"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <line
          x1="102"
          y1="254"
          x2="135"
          y2="284"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* 3. Tractor Body, Driver Seat & Engine Hood */}
        <path
          d="M142 272 L142 305 L310 305 C345 305 375 330 375 365 L375 390"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Front Engine Grille Louvers */}
        <line
          x1="245"
          y1="328"
          x2="348"
          y2="328"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <line
          x1="290"
          y1="356"
          x2="348"
          y2="356"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* 4. Chassis Rail between Wheels */}
        <line
          x1="228"
          y1="432"
          x2="305"
          y2="432"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* 5. Big Rear Wheel */}
        <circle
          cx="145"
          cy="428"
          r="86"
          stroke="#ffffff"
          strokeWidth="24"
          fill="none"
        />

        {/* 6. Front Wheel */}
        <circle
          cx="345"
          cy="445"
          r="66"
          stroke="#ffffff"
          strokeWidth="24"
          fill="none"
        />

        {/* 7. Motion & Ground Tracking Lines */}
        <line
          x1="65"
          y1="514"
          x2="145"
          y2="514"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <line
          x1="240"
          y1="514"
          x2="345"
          y2="514"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

