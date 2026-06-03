"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailShell />}>
      <ConfirmEmailForm />
    </Suspense>
  );
}

function ConfirmEmailShell() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-2xl p-8">
        <p className="text-center text-sm text-zinc-300">Loading...</p>
      </div>
    </div>
  );
}

function ConfirmEmailForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleConfirm(e) {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      setMessage("Enter your email first.");
      return;
    }

    if (cleanOtp.length !== 6) {
      setMessage("Enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "signup",
      });

      if (error) {
        showToast(error.message, "error");
        setMessage(error.message);
        return;
      }

      const profileResponse = await fetch("/api/create-account", {
        method: "POST",
      });
      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        showToast(profileResult.error || "Could not create account profile.", "error");
        setMessage(profileResult.error || "Could not create account profile.");
        return;
      }

      showToast("Email confirmed successfully.");
      router.push("/dashboard");
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Enter your email first.");
      return;
    }

    setMessage("");
    setResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (error) {
        showToast(error.message, "error");
        setMessage(error.message);
        return;
      }

      setEmail(cleanEmail);
      showToast("OTP sent again. Check your Gmail inbox.");
      setMessage("OTP sent again. Check your Gmail inbox.");
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
      setMessage(error.message || "Something went wrong.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleConfirm}
        className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-2xl p-8 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-yellow-500">
          Confirm Email
        </h1>

        <p className="text-center text-sm text-zinc-300">
          Enter the OTP sent to your email.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
          required
        />

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="OTP Code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none tracking-widest text-center"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          {loading ? "Confirming..." : "Confirm Email"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="w-full border border-yellow-500 text-yellow-500 py-3 rounded-lg font-semibold"
        >
          {resending ? "Sending..." : "Resend OTP"}
        </button>

        {message && <p className="text-center text-sm text-white">{message}</p>}

        <p className="text-center text-sm">
          <Link href="/login" className="text-yellow-500 underline">
            Back to Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
