"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });

    if (error) {
      showToast(error.message, "error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    showToast("Password reset link sent.");
    setMessage("Password reset link ayaa email-kaaga loo diray.");
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-yellow-500 bg-zinc-900 p-8"
      >
        <h1 className="text-center text-2xl font-bold text-yellow-500">
          Forgot Password
        </h1>

        <p className="text-center text-sm leading-6 text-zinc-300">
          Geli email-ka account-kaaga, waxaan kuu diri doonaa link aad password
          cusub ku samaysato.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 outline-none"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-yellow-500 py-3 font-semibold text-black"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && <p className="text-center text-sm text-yellow-400">{message}</p>}

        <p className="text-center text-sm">
          <Link href="/login" className="text-zinc-300 underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}
