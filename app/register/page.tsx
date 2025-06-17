"use client";

import { register } from "@/actions/auth";
import { AuthForm, FormField } from "@/components/AuthForm";
import Header from "@/components/Header";
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
    <>
      <Header />
      <AuthForm
        title="Register"
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        buttonText="Register"
        footerText="Already have an account?"
        footerLinkText="Login here"
        footerLinkHref="/login"
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

export default RegisterPage;
