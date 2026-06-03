"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    gender: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const email = form.email.trim().toLowerCase();
    const username = form.username.trim();
    const phone = form.phone.trim();

    if (form.password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            username,
            phone,
            gender: form.gender,
            role: "user",
            status: "active",
          },
        },
      });

      if (error) {
        showToast(error.message, "error");
        setMessage(error.message);
        return;
      }

      if (!data?.user) {
        showToast("Account could not be created. Please try again.", "error");
        setMessage("Account could not be created. Please try again.");
        return;
      }

      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });

        if (resendError) {
          showToast("Email-kan account ayuu horey u leeyahay. Fadlan login samee.", "error");
          setMessage("Email-kan account ayuu horey u leeyahay. Fadlan login samee.");
          return;
        }

        showToast("OTP sent again. Check your Gmail inbox.");
        setMessage("OTP sent again. Check your Gmail inbox.");
        router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });

      if (resendError) {
        showToast(
          "Account waa la abuuray, laakiin OTP email lama diri karin. Try Resend OTP.",
          "error"
        );
        setMessage(
          "Account waa la abuuray, laakiin OTP email lama diri karin. Try Resend OTP."
        );
        router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
        return;
      }

      showToast("OTP sent to your email. Check your Gmail inbox.");
      setMessage("OTP sent to your email. Check your Gmail inbox.");
      router.push(`/confirm-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      showToast(error.message || "Something went wrong.", "error");
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-2xl p-8 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-yellow-500">
          Create Account
        </h1>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
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

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 pr-10 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
        />

        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        {message && (
          <p className="text-center text-sm text-white">{message}</p>
        )}

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-500 underline">
            Sign In
          </Link>
        </p>

        <p className="text-center text-sm">
          <Link href="/" className="text-zinc-300 underline">
            Back to Home
          </Link>
        </p>
      </form>
    </div>
  );
}
