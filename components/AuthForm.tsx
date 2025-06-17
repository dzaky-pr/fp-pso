import Link from "next/link";
import React from "react";

interface FormFieldProps {
  id: string;
  name: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  type,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className = "mb-4",
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block font-semibold text-gray-800 dark:text-gray-200"
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full p-3 mt-2 bg-white/80 dark:bg-zinc-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300 transition"
        required={required}
      />
    </div>
  );
};

interface AuthFormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  error: string | null;
  loading: boolean;
  buttonText: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  children: React.ReactNode;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  error,
  loading,
  buttonText,
  footerText,
  footerLinkText,
  footerLinkHref,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-zinc-900 dark:to-zinc-800 transition-colors duration-300">
      <form
        onSubmit={onSubmit}
        className="my-10 w-full max-w-lg mx-auto p-6 rounded-2xl bg-white/40 dark:bg-white/10 border border-white/30 dark:border-white/20 backdrop-blur-md shadow-xl transition-all"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">{title}</h2>

        {error && (
          <div className="my-4 bg-red-400 text-white p-3 rounded-md text-center">
            {error}
          </div>
        )}

        {children}

        <button
          type="submit"
          className="w-full py-3 bg-btn-color text-white rounded-xl hover:bg-text-hover transition duration-300 shadow-md"
          disabled={loading}
        >
          {loading ? "Loading..." : buttonText}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {footerText}{" "}
          <Link href={footerLinkHref} className="text-blue-600 hover:underline">
            {footerLinkText}
          </Link>
        </p>
      </form>
    </div>
  );
};
