import { useEffect, useState } from "react";

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
      <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5 mt-6">
        <h3 className="text-cyan-400 font-semibold text-lg mb-3 flex items-center gap-2">
          <span>🔒</span> Safety Standards Report
        </h3>
        <div className="flex items-center gap-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-cyan-400"></div>
          <p className="text-slate-400 text-sm">Loading safety data...</p>
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

  return (
    <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 mt-6">
      <h3 className="text-cyan-400 font-semibold text-xl mb-4 flex items-center gap-2">
        <span className="text-2xl">🔒</span> Safety Standards Report
      </h3>

      <div className="space-y-3">
        {safetyItems.map((item, i) => (
          <div
            key={i}
            className={`px-5 py-3.5 rounded-lg border-l-4 text-sm font-medium transition-all duration-200 hover:shadow-lg ${
              item.type === "critical"
                ? "bg-red-950/40 border-red-500 text-red-200 hover:bg-red-950/50"
                : item.type === "warning"
                ? "bg-yellow-950/30 border-yellow-400 text-yellow-200 hover:bg-yellow-950/40"
                : item.type === "info"
                ? "bg-blue-950/30 border-blue-400 text-blue-200 hover:bg-blue-950/40"
                : "bg-emerald-950/30 border-emerald-400 text-emerald-200 hover:bg-emerald-950/40"
            }`}
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}
