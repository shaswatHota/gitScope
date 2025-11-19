import { useEffect, useState } from "react";
import { RiGitRepositoryPrivateLine } from "react-icons/ri";
import { TiWarningOutline } from "react-icons/ti";

export default function SafetyStandards() {
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    fetch("/repo.json")
      .then((res) => res.json())
      .then((data) => setRepoData(data))
      .catch((err) => console.error("Error loading repo.json:", err));
  }, []);

  if (!repoData) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4">
        <h3 className="text-cyan-300 font-semibold text-xl flex items-center gap-3 tracking-wide">
          <RiGitRepositoryPrivateLine className="text-3xl" /> Safety Standards Report
        </h3>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-400"></div>
          Loading safety data...
        </div>
      </div>
    );
  }

  const safety = repoData.safety_audit || {};
  const warnings = safety.warnings || [];

  const classification = safety.status || "Unknown";
  const riskScore = safety.risk_score ?? "N/A";

  const hasEnv = warnings.some((msg) => msg.toLowerCase().includes(".env"));
  const hasGitignore = !warnings.some((msg) => msg.toLowerCase().includes("no .gitignore"));
  const apiExposed = warnings.some(
    (msg) =>
      msg.toLowerCase().includes("api") ||
      msg.toLowerCase().includes("key") ||
      msg.toLowerCase().includes("token") ||
      msg.toLowerCase().includes("secret")
  );

  const safetyItems = [
    { message: `Classification: ${classification}`, type: "info" },
    { message: `Risk Score: ${riskScore}`, type: "info" },
    {
      message: `Has .env file: ${hasEnv ? "❌ Yes (Exposed)" : "✅ No"}`,
      type: hasEnv ? "warning" : "success",
    },
    {
      message: `Has .gitignore: ${hasGitignore ? "✅ Yes" : "❌ No"}`,
      type: hasGitignore ? "success" : "warning",
    },
    {
      message: `API Keys Exposed: ${apiExposed ? "🚨 Yes" : "🟢 No"}`,
      type: apiExposed ? "critical" : "success",
    },
  ];

  const itemStyles = {
    critical: {
      className:
        "bg-red-950/40 border border-red-500/70 text-red-200/90 shadow-[0_0_25px_rgba(248,113,113,0.35)]",
      glow: { textShadow: "0 0 12px rgba(248,113,113,0.7)" },
    },
    warning: {
      className:
        "bg-amber-900/30 border border-amber-400/60 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.3)]",
      glow: { textShadow: "0 0 10px rgba(251,191,36,0.65)" },
    },
    info: {
      className:
        "bg-blue-950/40 border border-cyan-400/60 text-cyan-100 shadow-[0_0_25px_rgba(34,197,233,0.35)]",
      glow: { textShadow: "0 0 12px rgba(34,197,233,0.7)" },
    },
    success: {
      className:
        "bg-emerald-950/40 border border-emerald-400/70 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]",
      glow: { textShadow: "0 0 12px rgba(16,185,129,0.7)" },
    },
  };

  return (
    <div className="bg-[#101725] border border-slate-700/70 rounded-2xl lg:rounded-l-2xl lg:border-r-0 p-6 md:p-8 shadow-2xl space-y-6 h-full">
      <div className="space-y-4">
        <h3 className="text-cyan-300 font-semibold text-2xl flex items-center gap-3 tracking-wide">
          <RiGitRepositoryPrivateLine className="text-3xl" /> Safety Standards Report
        </h3>
        <p className="text-slate-400 text-sm flex items-center gap-2">
          <TiWarningOutline className="text-lg text-cyan-300" />
          Live security insights inferred from the repository audit.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-700/60 space-y-4">
        {safetyItems.map((item, i) => {
          const { className, glow } = itemStyles[item.type];
          return (
            <div
              key={i}
              className={`px-5 py-4 indent-5 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 ${className}`}
              style={glow}
            >
              <p className="text-sm md:text-base font-semibold tracking-wide">{item.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

