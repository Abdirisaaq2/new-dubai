"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { showToast } from "@/lib/adminUi";

export default function RegisterPage() {
  const supabase = createClient();

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

    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match.", "error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          phone: form.phone,
          gender: form.gender,
        },
      },
    });

    if (error) {
      showToast(error.message, "error");
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        username: form.username,
        email: form.email,
        phone: form.phone,
        gender: form.gender,
        role: "user",
        status: "active",
      });

      if (profileError) {
        showToast(profileError.message, "error");
        setMessage(profileError.message);
        setLoading(false);
        return;
      }
    }

    showToast("Account created successfully.");
    setMessage("Account created successfully. You can now sign in.");
    setLoading(false);

    setForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      gender: "",
    });
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
