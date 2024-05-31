import React, { useState, useEffect } from 'react';
import MonacoEditor from "@monaco-editor/react";
import axios from 'axios';

const GitIntegration = () => {
  const [code, setCode] = useState('// type your code here');
  const [filePath, setFilePath] = useState('index.js');
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const saveCode = async () => {
    setLoading(true);
    setError('');
    try {
      // Check if the repository exists
      const repoExistsResponse = await axios.get('http://localhost:3001/repo-exists', {
        params: { username, repoName, accessToken },
      });

      if (!repoExistsResponse.data.exists) {
        // Create a new repository if it doesn't exist
        await axios.post(
          'http://localhost:3001/create-repo',
          { username, repoName, accessToken },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      // Save code to the repository
      const response = await axios.post(
        'http://localhost:3001/save-code',
        {
          username,
          repoName,
          filePath,
          commitMessage,
          code: btoa(code),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('Code saved:', response.data);
    } catch (error) {
      console.error('Error saving code:', error);
      setError('Failed to save code to GitHub.');
    } finally {
      setLoading(false);
    }
  };

  const githubAuthUrl = 'http://localhost:3001/auth/github';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">GitHub Code Editor</h1>
      {error && (
        <div className="text-red-500 text-center mb-4">
          {error}
        </div>
      )}
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="GitHub Username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repoName">
              Repository Name
            </label>
            <input
              type="text"
              id="repoName"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="Repository Name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="filePath">
              File Path
            </label>
            <input
              type="text"
              id="filePath"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="File Path"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
