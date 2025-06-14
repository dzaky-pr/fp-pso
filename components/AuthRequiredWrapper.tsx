"use client";

import { isAuthenticated } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthRequiredWrapperProps {
  children: React.ReactNode;
}

function AuthRequiredWrapper({ children }: AuthRequiredWrapperProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const authStatus = isAuthenticated();

      if (!authStatus) {
        router.push("/login");
      }
    }
  }, [router, isClient]);

  if (!isClient || !isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}

export default AuthRequiredWrapper;
