"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type {
  ConfirmationResult,
} from "firebase/auth";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recaptchaRef = useRef<any>(null);
  const router = useRouter();

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { auth } = await import("@/lib/firebase");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");

      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }

      const fullPhone = "+91" + phone;
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        recaptchaRef.current!
      );
      confirmationRef.current = confirmation;
      setStep("otp");
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Failed to send OTP. Please check the phone number.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await confirmationRef.current!.confirm(otp);
      const idToken = await result.user.getIdToken();

      const res = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (res?.error) {
        setError("Login failed. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Welcome to VIPANI
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Login with your mobile number
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="9876543210"
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  title="Enter 10-digit mobile number"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-blue-50 text-blue-700 text-sm px-4 py-3 rounded-lg">
              OTP sent to +91 {phone}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="------"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Change phone number
            </button>
          </form>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
