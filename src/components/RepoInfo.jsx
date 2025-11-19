import { FaCodeFork } from "react-icons/fa6";
import { GiStarsStack } from "react-icons/gi";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { RiGitRepositoryCommitsLine } from "react-icons/ri";

const RepoInfo = ({ info }) => {
  if (!info) return null;
  return (
    <div className="bg-[#141b23] border border-slate-700/50 rounded-xl p-6 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2 flex items-center gap-3">
          <RiGitRepositoryCommitsLine/>
          {info.name || "Repository"}
        </h2>
        {info.description && (
          <p className="text-slate-300 text-base leading-relaxed ml-9">
            {info.description}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 mb-6 ml-9">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
          <GiStarsStack className="p-5" />
          <span className="text-slate-200 font-medium">{info.stars || 0}</span>
        </div>
        <div className="flex items-center gap-2 p-5 bg-slate-700/50 rounded-lg border border-slate-600/50">
          <FaCodeFork />
          <span className="text-slate-200 font-medium">{info.forks || 0}</span>
        </div>
        {info.language && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <IoMdInformationCircleOutline className="p-5"/>
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
      
    </div>
  );
};
export default RepoInfo;
