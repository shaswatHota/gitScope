import { useEffect, useState } from "react";
import RepoInfo from "./components/RepoInfo";
import CommitGraph from "./components/CommitGraph";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-slate-300 text-lg font-medium">Loading repository data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            GitScope
          </h1>
          <p className="text-slate-400 text-sm">Repository Analysis & Visualization</p>
        </header>
        
        <div className="space-y-6">
          <RepoInfo info={repoData.repository_info} />
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-cyan-400"></span>
              Commit Graph
            </h2>
            <CommitGraph branches={repoData.branches} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
