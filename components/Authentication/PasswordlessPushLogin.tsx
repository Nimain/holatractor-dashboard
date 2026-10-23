"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Fingerprint,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage, successMessage } from "@/utils/Toastify/Messages";

interface PasswordlessPushLoginProps {
  onSuccess: (data: any) => void;
  onFallbackToPassword: () => void;
  defaultEmail?: string;
  lang?: "es" | "en";
}

const translations = {
  es: {
    checkPhone: "Revisa tu teléfono móvil",
    dispatchedPrompt: "Enviamos una solicitud de inicio de sesión para",
    selectMatch: "SELECCIONA ESTE NÚMERO COINCIDENTE EN TU TELÉFONO",
    expiresIn: "Expira en",
    waitingBiometric: "Esperando aprobación biométrica en tu teléfono...",
    simulatorTitle: "Simulador Directo en App",
    tapMatch: "Toca #",
    generateNew: "Generar Nueva Solicitud",
    usePasswordInstead: "Usar contraseña o Google en su lugar",
    accountEmail: "Correo de la Cuenta",
    biometricPushBadge: "Push Biométrico",
    sendPromptBtn: "Enviar Solicitud al Teléfono",
    sendingPrompt: "Enviando Solicitud Push...",
    instantApproveNote: "Aprueba al instante con Face ID, huella dactilar o PIN en tu app móvil.",
    validEmailRequired: "Por favor, introduce un correo electrónico válido",
    pushSent: "¡Solicitud push enviada! Número de coincidencia:",
    approvedToast: "¡Aprobación biométrica verificada! Abriendo panel...",
    rejectedToast: "La solicitud de inicio de sesión fue rechazada en el móvil.",
    expiredToast: "La solicitud expiró. Por favor inicia una nueva.",
  },
  en: {
    checkPhone: "Check Your Mobile Phone",
    dispatchedPrompt: "We dispatched a high-priority sign-in prompt for",
    selectMatch: "SELECT THIS MATCHING NUMBER ON YOUR PHONE",
    expiresIn: "Expires in",
    waitingBiometric: "Waiting for biometric approval on phone...",
    simulatorTitle: "Direct In-App Simulator",
    tapMatch: "Tap #",
    generateNew: "Generate New Request",
    usePasswordInstead: "Use password or Google instead",
    accountEmail: "Account Email",
    biometricPushBadge: "Biometric Push",
    sendPromptBtn: "Send Sign-In Prompt to Phone",
    sendingPrompt: "Sending Push Request...",
    instantApproveNote: "Instantly approve with Face ID, Touch ID, or PIN in your mobile app.",
    validEmailRequired: "Please enter a valid email address",
    pushSent: "Push challenge sent! Match number:",
    approvedToast: "Mobile biometric approval verified! Unlocking dashboard...",
    rejectedToast: "Login request was rejected on mobile device.",
    expiredToast: "Login challenge expired. Please initiate a new request.",
  },
};

export default function PasswordlessPushLogin({
  onSuccess,
  onFallbackToPassword,
  defaultEmail = "",
  lang = "es",
}: PasswordlessPushLoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [matchNumber, setMatchNumber] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [approving, setApproving] = useState(false);

  const t = translations[lang] || translations.es;
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (challengeId && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [challengeId]);

  // Polling listener for challenge status
  useEffect(() => {
    if (!challengeId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`/api/auth/push-challenge/status?id=${challengeId}`);
        if (res.data?.status === "APPROVED" && res.data?.access_token) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setChallengeId(null);
          successMessage(t.approvedToast);
          onSuccess(res.data);
        } else if (res.data?.status === "REJECTED") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          errorMessage(t.rejectedToast);
          setChallengeId(null);
        } else if (res.data?.status === "EXPIRED") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          errorMessage(t.expiredToast);
          setChallengeId(null);
        }
      } catch (e) {
        // Continue polling silently
      }
    }, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [challengeId, onSuccess, t]);

  const handleInitiatePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      errorMessage(t.validEmailRequired);
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
        successMessage(`${t.pushSent} ${res.data.match_number}`);
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
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setChallengeId(null);
        successMessage(t.approvedToast);
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
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-3 rounded-2xl bg-red-500/10 text-[#E31B23] dark:text-red-400 border border-red-500/20 shadow-inner">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {t.checkPhone}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {t.dispatchedPrompt}{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">{email}</span>.
          </p>
        </div>

        {/* Big Number Match Card */}
        <div className="relative p-6 rounded-3xl bg-gradient-to-b from-[#180405] via-[#100203] to-[#180405] border border-red-500/40 text-white shadow-2xl text-center space-y-4 overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#E31B23] via-rose-500 to-[#E31B23]" />
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#E31B23]/15 rounded-full blur-2xl pointer-events-none" />

          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
            {t.selectMatch}
          </p>

          <div className="py-2">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-red-600/20 to-red-700/30 border-2 border-[#E31B23]/60 shadow-xl shadow-[#E31B23]/30">
              <span className="text-5xl font-black text-[#E31B23] tracking-tighter drop-shadow-md">
                {matchNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#E31B23]" />
            <span>
              {t.expiresIn} {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 border-t border-red-950/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E31B23]" />
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {t.waitingBiometric}
            </span>
          </div>
        </div>

        {/* ── INTERACTIVE MOBILE SIMULATOR / TEST TRIGGER ─────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-[#E31B23]" />
              <span>{t.simulatorTitle}</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold text-[#E31B23] border-red-400/40">
              {t.tapMatch}{matchNumber}
            </Badge>
          </div>

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
                    ? "hover:bg-[#E31B23] hover:text-white hover:border-[#E31B23]"
                    : "hover:bg-rose-50 hover:text-[#E31B23] hover:border-red-300"
                }`}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>

        {/* Fallback buttons */}
        <div className="space-y-2 pt-1">
          {isExpired && (
            <Button
              type="button"
              onClick={handleInitiatePush}
              className="w-full h-10 rounded-xl bg-[#E31B23] hover:bg-[#C9141B] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-700/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.generateNew}</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onFallbackToPassword}
            className="w-full h-9 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            {t.usePasswordInstead}
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
            {t.accountEmail}
          </Label>
          <Badge className="bg-red-500/15 text-[#E31B23] dark:text-red-300 border border-red-500/30 text-[9px] font-black uppercase px-2 py-0.5">
            {t.biometricPushBadge}
          </Badge>
        </div>
        <Input
          id="passwordless_email"
          type="email"
          placeholder={t.accountEmail === "Account Email" ? "e.g. farmer@holatractor.com" : "ej. agricultor@holatractor.com"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs h-11 bg-white dark:bg-slate-900/50 focus-visible:ring-2 focus-visible:ring-[#E31B23]/30"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-[#E31B23] hover:bg-[#C9141B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#E31B23]/25 transition-all group active:scale-[0.99]"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t.sendingPrompt}</span>
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>{t.sendPromptBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </>
        )}
      </Button>

      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-500">
        <ShieldCheck className="w-4 h-4 text-[#E31B23] shrink-0" />
        <span>{t.instantApproveNote}</span>
      </div>
    </form>
  );
}
