"use client";

import React from "react";

interface FarmerBrandIconProps {
  className?: string;
  size?: number | string;
  variant?: "rounded-square" | "transparent" | "pill";
}

/**
 * HolaTractor Official Farmer Brand Icon
 * Modern Emerald & Forest Green agronomic theme featuring the tractor + wireless dispatch signal.
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
        {/* Farmer Dashboard Signature Emerald Agronomic Gradients */}
        <linearGradient id="farmerBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        <linearGradient id="farmerGlowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="farmerShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#047857" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* ── BACKGROUND CONTAINER ── */}
      {!isTransparent && (
        <>
          <rect
            width="512"
            height="512"
            rx="115"
            fill="url(#farmerBgGradient)"
          />
          {/* Subtle upper glass highlight */}
          <rect
            width="512"
            height="256"
            rx="115"
            fill="url(#farmerGlowGradient)"
          />
        </>
      )}

      {/* ── WHITE TRACTOR + PHONE WIRELESS DISPATCH ICON ── */}
      <g transform="translate(42, 42) scale(0.835)">
        {/* 1. Wireless Signal Waves above Phone Handset */}
        <path
          d="M260 52 C285 52, 308 63, 324 81"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M245 88 C262 88, 278 96, 290 110"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        {/* Handset Signal Center Dot */}
        <circle cx="260" cy="142" r="16" fill="#ffffff" />

        {/* Phone Handset */}
        <path
          d="M210 105 C202 96 188 94 178 102 L150 125 C142 132 140 144 146 153 C166 184 195 212 227 232 C236 238 248 236 255 228 L278 200 C286 190 284 176 275 168 L245 142 C237 135 225 137 218 145 L210 155 C190 145 175 130 165 110 L175 102 Z"
          fill="#ffffff"
        />

        {/* 2. Tractor Steering Column & Wheel */}
        <line
          x1="125"
          y1="165"
          x2="85"
          y2="215"
          stroke="#ffffff"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <line
          x1="70"
          y1="200"
          x2="105"
          y2="235"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* 3. Tractor Body, Seat & Hood Outline */}
        <path
          d="M130 215 L130 250 L345 250 C385 250 415 280 415 320 L415 345 L385 345"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Front Grille Slots */}
        <line
          x1="285"
          y1="275"
          x2="390"
          y2="275"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <line
          x1="345"
          y1="305"
          x2="390"
          y2="305"
          stroke="#ffffff"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* 4. Chassis connecting back and front */}
        <line
          x1="220"
          y1="375"
          x2="320"
          y2="375"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* 5. Big Rear Wheel */}
        <circle
          cx="150"
          cy="365"
          r="86"
          stroke="#ffffff"
          strokeWidth="24"
          fill="none"
        />

        {/* 6. Front Wheel */}
        <circle
          cx="375"
          cy="385"
          r="66"
          stroke="#ffffff"
          strokeWidth="24"
          fill="none"
        />

        {/* 7. Bottom Motion / Ground Speed Lines */}
        <line
          x1="30"
          y1="452"
          x2="150"
          y2="452"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <line
          x1="275"
          y1="452"
          x2="410"
          y2="452"
          stroke="#ffffff"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
