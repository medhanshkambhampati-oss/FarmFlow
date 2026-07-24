import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

const ERROR_MESSAGES = {
  no_code:           "Google did not return an authorization code.",
  no_email:          "Could not retrieve your email from Google.",
  no_access_token:   "Failed to get access token from Google.",
  auth_failed:       "Google sign-in failed. Please try again.",
  redirect_mismatch: "OAuth redirect URI mismatch — check Google Cloud Console settings.",
  access_denied:     "You denied access. Please allow permissions to continue.",
  server_config:     "Server OAuth configuration error. Contact support.",
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token  = searchParams.get("token");
    const name   = searchParams.get("name");
    const email  = searchParams.get("email");
    const error  = searchParams.get("error");

    if (error) {
      const msg = ERROR_MESSAGES[error] || "Google sign-in failed. Please try again.";
      toast.error(msg);
      navigate("/login");
      return;
    }

    if (token) {
      localStorage.setItem("token",     token);
      localStorage.setItem("userName",  name  || "");
      localStorage.setItem("userEmail", email || "");
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } else {
      toast.error("Authentication failed — no token received.");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex w-full flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-300">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      <p className="mt-4 text-gray-400">Signing you in with Google...</p>
    </div>
  );
}
