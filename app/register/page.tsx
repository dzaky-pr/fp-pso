// dzaky-pr/fp-pso/fp-pso-9738172cec4b52a89eaa97d40be888bf59610291/app/register/page.tsx
"use client";

import { register } from "@/actions/auth";
import Header from "@/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await register({ email, password });

    if (result.success) {
      alert("Registration successful! Please login.");
      router.push("/login"); // Redirect to login page after successful registration
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <Header />
      <form
        onSubmit={handleSubmit}
        className="my-10 w-full max-w-lg mx-auto p-6 rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 backdrop-blur-md shadow-xl transition-all"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>

        {error && (
          <div className="my-4 bg-red-400 text-white p-3 rounded-md text-center">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block font-semibold text-gray-800 dark:text-gray-200"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block font-semibold text-gray-800 dark:text-gray-200"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-btn-color text-white rounded-xl hover:bg-text-hover transition duration-300 shadow-md"
          disabled={loading}
        >
          {loading ? "Loading..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
