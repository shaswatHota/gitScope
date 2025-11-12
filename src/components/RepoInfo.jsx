import SafetyStandards from "./SafetyStandards";
const RepoInfo = ({ info }) => {
  if (!info) return null;
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
          <span className="text-cyan-400">📦</span>
          Repo Name : {info.name || "Repository"}
        </h2>
        {info.description && (
          <p className="text-slate-300 text-base leading-relaxed ml-9">
            {info.description}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6 ml-9">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
          <span className="text-yellow-400">⭐</span>
          <span className="text-slate-200 font-medium">{info.stars || 0}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
          <span className="text-blue-400">🍴</span>
          <span className="text-slate-200 font-medium">{info.forks || 0}</span>
        </div>
        {info.language && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <span className="text-purple-400"></span>
            <span className="text-slate-200 font-medium">{info.language}</span>
          </div>
        )}
        {info.license && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <span className="text-green-400">📄</span>
            <span className="text-slate-200 font-medium">{info.license}</span>
          </div>
        )}
      </div>
      
      <SafetyStandards />
    </div>
  );
};
export default RepoInfo;
