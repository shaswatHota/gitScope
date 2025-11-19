#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <regex>
#include <curl/curl.h>
#include "json.hpp"
#include <iomanip>
#include <unordered_set>
#include <unordered_map>

using namespace std;
using json = nlohmann::json;

class CurlClient {
public:
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, string* output) {
        size_t totalSize = size * nmemb;
        output->append((char*)contents, totalSize);
        return totalSize;
    }

    string get(const string& url) {
        CURL* curl = curl_easy_init();
        string response;

        if (curl) {
            curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
            curl_easy_setopt(curl, CURLOPT_USERAGENT, "GitScope-CPP/1.0");
            curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
            curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
            curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

            CURLcode res = curl_easy_perform(curl);
            if (res != CURLE_OK)
                cerr << "CURL error: " << curl_easy_strerror(res) << endl;

            curl_easy_cleanup(curl);
        }
        return response;
    }
};

class Commit {
public:
    string hash, message, author, date, parent;
    Commit(string h, string m, string a, string d, string p = "")
        : hash(h), message(m), author(a), date(d), parent(p) {}

    json toJson() const {
        return {{"hash", hash}, {"message", message}, {"author", author}, {"date", date}, {"parent", parent}};
    }
};

class Branch {
public:
    string name, head;
    vector<Commit> commits;
    Branch(string n, string h) : name(n), head(h) {}

    json toJson() const {
        json j;
        j["name"] = name;
        j["head"] = head;
        j["commits"] = json::array();
        for (auto& c : commits) j["commits"].push_back(c.toJson());
        return j;
    }
};

class RepoScanner {
    string owner, repo;
    CurlClient http;
    vector<Branch> branches;
    json repoInfo;
    json safetyReport;

public:
    RepoScanner(string url) { parseGitHubURL(url); }

    void parseGitHubURL(const string& url) {
        regex pattern("github\\.com/([^/]+)/([^/]+)");
        smatch match;
        if (regex_search(url, match, pattern)) {
            owner = match[1];
            repo = match[2];
            if (!repo.empty() && repo.back() == '/') repo.pop_back();
            if (repo.size() > 4 && repo.substr(repo.size() - 4) == ".git")
                repo = repo.substr(0, repo.size() - 4);
        } else {
            throw invalid_argument("Invalid GitHub URL format.");
        }
    }

private:
    void ensureObject(const json& j, const string& ctx) {
        if (!j.is_object()) throw runtime_error("Unexpected JSON for " + ctx);
    }

public:
    void fetchRepoInfo() {
        string apiUrl = "https://api.github.com/repos/" + owner + "/" + repo;
        string response = http.get(apiUrl);
        json data = json::parse(response);
        ensureObject(data, "repo info");

        repoInfo["name"] = data.value("name", "");
        repoInfo["language"] = data.value("language", "Unknown");
        repoInfo["default_branch"] = data.value("default_branch", "main");
        repoInfo["stars"] = data.value("stargazers_count", 0);
        repoInfo["forks"] = data.value("forks_count", 0);
        repoInfo["watchers"] = data.value("watchers_count", 0);
    }

    void fetchBranches() {
        string apiUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/branches";
        string response = http.get(apiUrl);
        json data = json::parse(response);
        if (!data.is_array()) throw runtime_error("Branches response not array");
        for (auto& b : data) {
            string name = b.value("name", "");
            string head = b["commit"].value("sha", "");
            branches.emplace_back(name, head);
        }
    }

    void fetchCommits(int limit = 10) {
        for (auto& branch : branches) {
            cout << "Fetching commits for branch: " << branch.name << endl;
            string url = "https://api.github.com/repos/" + owner + "/" + repo +
                         "/commits?sha=" + branch.name + "&per_page=" + to_string(limit);
            string res = http.get(url);
            json commitsJson = json::parse(res);
            if (!commitsJson.is_array()) continue;
            for (auto& c : commitsJson) {
                string hash = c.value("sha", "");
                string msg = c["commit"].value("message", "");
                string author = c["commit"]["author"].value("name", "");
                string date = c["commit"]["author"].value("date", "");
                string parent = "";
                if (c.contains("parents") && c["parents"].is_array() && !c["parents"].empty())
                    parent = c["parents"][0].value("sha", "");
                branch.commits.emplace_back(hash, msg, author, date, parent);
            }
        }
    }

    void performSafetyCheck() {
        cout << "\nPerforming safety scan...\n";
        vector<string> warnings;
        int riskScore = 0;

        string treeUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/git/trees/main?recursive=1";
        string response = http.get(treeUrl);
        json data;
        try {
            data = json::parse(response);
        } catch (...) {
            cerr << "Error parsing file tree JSON.\n";
            return;
        }

        if (!data.contains("tree") || !data["tree"].is_array()) {
            cerr << "No file tree found.\n";
            return;
        }

        bool hasEnv = false, hasGitignore = false, hasKeys = false;
        unordered_set<string> rootFolders;
        unordered_map<string, bool> folderHasGitignore;
        unordered_map<string, bool> folderHasDeps;
        const regex skipConfig("(eslint\\.config|vite\\.config)", regex::icase);
        const regex sensitivePattern("key|secret|token|config", regex::icase);
        const regex dependencyPattern("(node_modules|vendor|deps|packages)", regex::icase);

        for (auto& f : data["tree"]) {
            if (!f.is_object() || !f.contains("path")) continue;
            string path = f["path"].get<string>();

            if (regex_search(path, skipConfig))
                continue;

            if (path.find(".env") != string::npos) {
                hasEnv = true;
                warnings.push_back(".env file detected (" + path + ") — may contain secrets.");
                riskScore += 3;
            }

            if (path == ".gitignore") hasGitignore = true;

            if (regex_search(path, sensitivePattern)) {
                hasKeys = true;
                warnings.push_back("Potential sensitive file: " + path);
                riskScore += 2;
            }

            size_t slashPos = path.find('/');
            string type = f.value("type", "");
            if (slashPos == string::npos) {
                if (type == "tree") {
                    rootFolders.insert(path);
                    if (regex_search(path, dependencyPattern))
                        folderHasDeps[path] = true;
                }
            } else {
                string rootFolder = path.substr(0, slashPos);
                rootFolders.insert(rootFolder);
                string relativePath = path.substr(slashPos + 1);
                if (relativePath.find(".gitignore") != string::npos)
                    folderHasGitignore[rootFolder] = true;
                if (regex_search(relativePath, dependencyPattern))
                    folderHasDeps[rootFolder] = true;
            }
        }

        if (!hasGitignore) {
            warnings.push_back("No .gitignore file found — sensitive files may be committed.");
            riskScore += 2;
        }

        if (!hasEnv)
            warnings.push_back("No .env file found (good security practice).");

        if (!hasKeys)
            warnings.push_back("No suspicious files containing 'key', 'token', or 'secret' in name.");

        if (!rootFolders.empty()) {
            for (const auto& folder : rootFolders) {
                if (!folderHasGitignore.count(folder)) {
                    warnings.push_back("Folder '" + folder + "' does not contain its own .gitignore file.");
                    riskScore += 1;
                }
                if (folderHasDeps.count(folder)) {
                    warnings.push_back("Folder '" + folder + "' includes a dependency directory (e.g., node_modules/vendor).");
                    riskScore += 2;
                }
            }
        }

        string status;
        if (riskScore <= 3)
            status = "Safe";
        else if (riskScore <= 6)
            status = "Moderate Risk";
        else
            status = "High Risk";

        safetyReport = {
            {"warnings", warnings},
            {"risk_score", riskScore},
            {"status", status}
        };

        cout << "\n=== Safety Report for " << repo << " ===\n";
        for (auto& w : warnings)
            cout << " - " << w << endl;
        cout << "\nRisk Score: " << riskScore << " / 10\n"
             << "Status: " << status << endl;
    }

    void exportToJson() {
        json output;
        output["repository_info"] = repoInfo;
        output["branches"] = json::array();
        for (auto& b : branches) output["branches"].push_back(b.toJson());
        output["safety_audit"] = safetyReport;

        ofstream out("repo.json");
        out << setw(4) << output;
        cout << "\n Exported repository data + safety report to repo.json\n";
    }
};

int main() {
    string url;
    cout << "Enter GitHub repository URL: ";
    cin >> url;

    try {
        RepoScanner scanner(url);
        cout << "\n Fetching repository info...\n";
        scanner.fetchRepoInfo();

        cout << " Fetching branches...\n";
        scanner.fetchBranches();

        cout << " Fetching commits...\n";
        scanner.fetchCommits(10);

        scanner.performSafetyCheck();

        scanner.exportToJson();
    } catch (exception& e) {
        cerr << " Error: " << e.what() << endl;
    }

    return 0;
}
