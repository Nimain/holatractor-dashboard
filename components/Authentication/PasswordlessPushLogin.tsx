"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Lock,
  ChevronRight,
  AlertTriangle,
  Fingerprint,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface PasswordlessPushLoginProps {
  onSuccess: (data: any) => void;
  onFallbackToPassword: () => void;
  defaultEmail?: string;
}

export default function PasswordlessPushLogin({
  onSuccess,
  onFallbackToPassword,
  defaultEmail = "",
}: PasswordlessPushLoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [matchNumber, setMatchNumber] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isSimulatingMobile, setIsSimulatingMobile] = useState(false);
  const [approving, setApproving] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (challengeId && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollingRef.current) clearInterval(pollingRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [challengeId]);

  // Polling listener for challenge status
  useEffect(() => {
    if (!challengeId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/auth/push-challenge/status?id=${challengeId}`);
        if (res.data?.status === "APPROVED" && res.data?.access_token) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          successMessage("Mobile biometric approval verified! Unlocking dashboard...");
          onSuccess(res.data);
        } else if (res.data?.status === "REJECTED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          errorMessage("Login request was rejected on mobile device.");
          setChallengeId(null);
        } else if (res.data?.status === "EXPIRED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
          errorMessage("Login challenge expired. Please initiate a new request.");
          setChallengeId(null);
        }
      } catch (e) {
        // Continue polling silently
      }
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [challengeId, onSuccess]);

  const handleInitiatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      errorMessage("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/push-challenge", {
        email: email.trim().toLowerCase(),
        device_info: typeof window !== "undefined" ? window.navigator.userAgent : "Desktop Web",
      });

      if (res.data?.success && res.data?.challenge_id) {
        setChallengeId(res.data.challenge_id);
        setMatchNumber(res.data.match_number);
        setOptions(res.data.options || [res.data.match_number]);
        setTimeLeft(res.data.expires_in || 120);
        successMessage(`Push challenge sent! Match number: ${res.data.match_number}`);
      } else {
        errorMessage(res.data?.error || "Failed to initiate push login");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Failed to connect to authentication service");
    } finally {
      setLoading(false);
    }
  };

  // Mobile App / Simulator Approval trigger
  const handleSimulateApprove = async (selectedNum: number) => {
    if (!challengeId) return;
    setApproving(true);
    try {
      const res = await axios.post("/api/auth/push-challenge/approve", {
        challenge_id: challengeId,
        selected_number: selectedNum,
      });

      if (res.data?.success && res.data?.access_token) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        successMessage("Mobile approval successful! Redirecting...");
        onSuccess(res.data);
      } else {
        errorMessage(res.data?.error || "Number match failed");
      }
    } catch (err: any) {
      errorMessage(err?.response?.data?.error || "Approval failed");
    } finally {
      setApproving(false);
    }
  };

  // ── 1. ACTIVE CHALLENGE SCREEN (GITHUB / OUTLOOK NUMBER MATCH) ───────────────
  if (challengeId && matchNumber !== null) {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isExpired = timeLeft <= 0;

    return (
      <div className="w-full space-y-5 animate-in fade-in-50 duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Smartphone className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Check Your Mobile App
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            We sent a sign-in request to your HolaTractor Mobile App for{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>.
          </p>
        </div>

        {/* Big Number Match Card */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-white shadow-2xl text-center space-y-4 overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Select this matching number in your app
          </p>

          <div className="py-2">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/25">
              <span className="text-5xl font-black text-emerald-400 tracking-tighter">
                {matchNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Waiting for biometric approval on phone...
            </span>
          </div>
        </div>

        {/* ── INTERACTIVE MOBILE SIMULATOR / TEST TRIGGER ─────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span>Mobile In-App Prompt Demo</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-300">
              Tap matching #{matchNumber}
            </Badge>
          </div>

          <p className="text-[11px] text-slate-500">
            Simulate your phone screen response:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {options.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant="outline"
                disabled={approving || isExpired}
                onClick={() => handleSimulateApprove(opt)}
                className={`h-11 rounded-xl text-base font-black transition-all ${
                  opt === matchNumber
                    ? "hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                    : "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                }`}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>

        {/* Fallback buttons */}
        <div className="space-y-2 pt-2">
          {isExpired && (
            <Button
              type="button"
              onClick={handleInitiatePush}
              className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Generate New Request</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onFallbackToPassword}
            className="w-full h-9 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Use password or Google instead
          </Button>
        </div>
      </div>
    );
  }

  // ── 2. INITIAL PASSWORDLESS EMAIL ENTRY SCREEN ─────────────────────────────
  return (
    <form onSubmit={handleInitiatePush} className="w-full space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="passwordless_email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Account Email
          </Label>
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase px-1.5 py-0">
            No Password Required
          </Badge>
        </div>
        <Input
          id="passwordless_email"
          type="email"
          placeholder="e.g. farmer@holatractor.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-11"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all group"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Sending Push Request...</span>
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>Send Sign-In Request to Mobile App</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </>
        )}
      </Button>

      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Approves instantly with Face ID / Fingerprint on your phone.</span>
      </div>
    </form>
  );
}
