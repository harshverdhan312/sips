import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Zap } from "lucide-react";
import { Button } from "../components/common/Button";
import { useAuth } from "../context/AuthContext";

export function NotFoundPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
        <Zap className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-8">
        The placement module or report you are looking for does not exist or has been relocated.
      </p>
      <div className="flex gap-3">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          icon={Home}
          onClick={() => navigate(role ? `/${role}/dashboard` : "/login")}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
