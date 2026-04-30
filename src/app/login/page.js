"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const user = data?.user;

    if (!user) {
      setMessage("Login failed.");
      setLoading(false);
      return;
    }

    // 1) first try by email
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, status")
      .eq("email", user.email)
      .maybeSingle();

    // 2) fallback try by auth user id
    if (!profile) {
      const fallback = await supabase
        .from("profiles")
        .select("id, email, role, status")
        .eq("id", user.id)
        .maybeSingle();

      profile = fallback.data;
      profileError = fallback.error;
    }

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    if (!profile) {
      setMessage("Profile not found.");
      setLoading(false);
      return;
    }

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      showToast("Your account is blocked.", "error");
      setMessage("Your account is blocked.");
      setLoading(false);
      return;
    }

    showToast("Login successful");

    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleLogin}
          className="w-full bg-zinc-900 border border-yellow-500 rounded-2xl p-8 space-y-4"
        >
          <h1 className="text-2xl font-bold text-center text-yellow-500">
            Sign In
          </h1>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <p className="text-right text-sm">
            <Link href="/forgot-password" className="text-yellow-500 underline">
              Forgot password?
            </Link>
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && (
            <p className="text-center text-sm text-red-400">{message}</p>
          )}

          <p className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-yellow-500 underline">
              Sign Up
            </Link>
          </p>

          <p className="text-center text-sm">
            <Link href="/" className="text-zinc-300 underline">
              Back to Home
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
