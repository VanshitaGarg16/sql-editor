import React, { useState, useEffect } from 'react';
import MonacoEditor from "@monaco-editor/react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GitIntegration = () => {
  const [code, setCode] = useState('// type your code here');
  const [filePath, setFilePath] = useState('');
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [repositories, setRepositories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const token = urlParams.get('token');
      if (token) {
        setAccessToken(token);
      }
      if (code) {
        try {
          const response = await axios.get(`http://localhost:3001/exchange-code?code=${code}`);
          setAccessToken(response.data.access_token);
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          setError('Failed to exchange code for token.');
        }
      }
    };

    exchangeCodeForToken();
  }, []);

  useEffect(() => {
    const fetchUsername = async () => {
      if (accessToken) {
        try {
          const response = await axios.get('http://localhost:3001/get-username', {
            params: { accessToken },
          });
          setUsername(response.data.username);
        } catch (error) {
          console.error('Error fetching username:', error);
          setError('Failed to fetch username.');
        }
      }
    };

    fetchUsername();
  }, [accessToken]);

  useEffect(() => {
    const fetchRepositories = async () => {
      if (accessToken) {
        try {
          const response = await axios.get('http://localhost:3001/get-repos', {
            params: { accessToken },
          });
          setRepositories(response.data);
        } catch (error) {
          console.error('Error fetching repositories:', error);
          setError('Failed to fetch repositories.');
        }
      }
    };

    fetchRepositories();
  }, [accessToken]);

  const fetchBranches = async (repo) => {
    try {
      const response = await axios.get('http://localhost:3001/get-branches', {
        params: { username, repo, accessToken },
      });
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to fetch branches.');
    }
  };

  const fetchFiles = async (repo, branch) => {
    try {
      const response = await axios.get('http://localhost:3001/get-files', {
        params: { username, repo, branch, accessToken },
      });
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files.');
    }
  };

  const fetchFileContent = async (repo, branch, path) => {
    try {
      const response = await axios.get('http://localhost:3001/get-file-content', {
        params: { username, repo, branch, path, accessToken },
      });
      setCode(atob(response.data.content));
    } catch (error) {
      console.error('Error fetching file content:', error);
      setError('Failed to fetch file content.');
    }
  };

  const saveCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Check if the repository exists
      const repoExistsResponse = await axios.post('http://localhost:3001/update-file', { username, selectedRepo, selectedFile, code, commitMessage, accessToken
      });
      toast.success('Code saved to GitHub successfully!');
    } catch (error) {
      console.error('Error saving code:', error);
      setError('Failed to save code to GitHub.');
      toast.error('Failed to save code to GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const handleRepoChange = (e) => {
    const repo = e.target.value;
    setSelectedRepo(repo);
    fetchBranches(repo);
  };

  const handleBranchChange = (e) => {
    const branch = e.target.value;
    setSelectedBranch(branch);
    fetchFiles(selectedRepo, branch);
  };

  const handleFileChange = (e) => {
    const file = e.target.value;
    setSelectedFile(file);
    fetchFileContent(selectedRepo, selectedBranch, file);
  };

  const githubAuthUrl = 'http://localhost:3001/auth/github';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">GitHub Code Editor</h1>
      <ToastContainer />
      {!accessToken ? (
        <div className="text-center">
          <a
            href={githubAuthUrl}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Authenticate with GitHub
          </a>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              GitHub Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              readOnly
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-200"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repoName">
              Repository Name
            </label>
            <select
              id="repoName"
              value={selectedRepo}
              onChange={handleRepoChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a repository</option>
              {repositories.map((repo) => (
                <option key={repo.name} value={repo.name}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>
          {selectedRepo && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branchName">
                Branch Name
              </label>
              <select
                id="branchName"
                value={selectedBranch}
                onChange={handleBranchChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedBranch && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fileName">
                File Name
              </label>
              <select
                id="fileName"
                value={selectedFile}
                onChange={handleFileChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select a file</option>
                {files.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="mb-6">
            <MonacoEditor
              width="100%"
              height="400px"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(newValue) => setCode(newValue)}
              className="border rounded"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="commitMessage">
              Commit Message
            </label>
            <input
              type="text"
              id="commitMessage"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit Message"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <button
            onClick={saveCode}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Code to GitHub'}
          </button>
        </>
      )}
    </div>
  );
}

export default GitIntegration;
