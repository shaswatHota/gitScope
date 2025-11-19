import { useEffect, useState } from "react";
import RepoInfo from "./components/RepoInfo";
import CommitGraph from "./components/CommitGraph";
import SafetyStandards from "./components/SafetyStandards";
import { PiGraphBold } from "react-icons/pi";

function App() {
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    fetch("/repo.json")
      .then((res) => res.json())
      .then((data) => setRepoData(data))
      .catch((err) => console.error("Error loading repo.json:", err));
  }, []);

  if (!repoData)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1017]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">Loading repository data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0d1017] text-slate-100 flex justify-center px-4">
      <div className="w-full max-w-6xl py-10 space-y-10">
        <header className="space-y-2 text-left ">
          <h1 className="text-4xl font-bold bg-white/90 bg-clip-text text-transparent">
            GitScope
          </h1>
          <p className="text-slate-400 text-sm">
            Repository Analysis & Visualization
          </p>
        </header>

        <main className="space-y-10">
          <RepoInfo info={repoData.repository_info} />

          <div className="grid gap-0 lg:grid-cols-6 items-stretch">
            <div className="lg:col-span-2">
              <SafetyStandards />
            </div>

            <section className="lg:col-span-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-none lg:rounded-r-2xl lg:border-l-0 p-6 shadow-2xl">
              <h2 className="text-2xl font-semibold text-cyan-400 mb-4 flex items-center gap-3 justify-center">
                <PiGraphBold className="text-cyan-400"/>
                Commit Graph
              </h2>
              <CommitGraph branches={repoData.branches} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
