"use client"; 

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    try{
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
        credentials: "include", 
      });

      let data: { message?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
   
        setError(data?.message || "Login failed");
        return;
      }

      router.push("/dashboard");


    }catch (error) {
      console.error("Login error:", error);
      setError("Something went wrong. Please try again.");

    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center   dark:bg-gray-900 p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-md shadow-md w-full max-w-xl h-full max-h-screen "
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign In</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <Label htmlFor="identifier" className="py-3">
            Email หรือ Username
          </Label>
          <Input
            id="identifier"
            type="text"
            placeholder="Email or Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="mb-6">
          <Label htmlFor="password" className="py-3">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full">
          Sign In
        </Button>
        <a
          href="#"
          className="ml-auto inline-block text-sm underline-offset-4 hover:underlin py-2"
        >
          Forgot your password?
        </a>
        <div className="flex gap-4 mt-4 items-center">
          <Button
            variant="outline"
            type="button"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="#4285F4"
                width="24"
                height="24"
              />
            </svg>
            Google
          </Button>

          <Button
            variant="outline"
            type="button"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M22.675 0h-21.35C.6 0 0 .6 0 1.325v21.351C0 23.4.6 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.466.099 2.797.143v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.763v2.312h3.59l-.467 3.622h-3.123V24h6.116C23.4 24 24 23.4 24 22.675V1.325C24 .6 23.4 0 22.675 0z"
                fill="#1877F2"
              />
            </svg>
            Facebook
          </Button>
        </div>
      </form>
    </div>
  );
}
