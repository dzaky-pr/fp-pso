"use client";

import { login } from "@/actions/auth";
import { AuthForm, FormField } from "@/components/AuthForm";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useState } from "react";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login({ email, password });

    if (result.success) {
      router.push("/"); // Redirect to home page on successful login
      router.refresh(); // Force a refresh to re-fetch data if needed
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <Header />
      <AuthForm
        title="Login"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        buttonText="Login"
        footerText="Don't have an account?"
        footerLinkText="Register here"
        footerLinkHref="/register"
      >
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="mb-6"
        />
      </AuthForm>
    </>
  );
}

export default LoginPage;
