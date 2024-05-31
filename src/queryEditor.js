import React, { useState } from 'react';
import MonacoEditor from "@monaco-editor/react";
import { Octokit } from '@octokit/rest';

const GitIntegration = () => {
  const [repoOption, setRepoOption] = useState('existing'); // 'existing' or 'new'
  const [repoName, setRepoName] = useState('');
  const [code, setCode] = useState('// type your code here');
  const [filePath, setFilePath] = useState('index.js');
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [token, setToken] = useState(''); // GitHub personal access token
  const [username, setUsername] = useState(''); // GitHub username

  const octokit = new Octokit({
    auth: token
  });

  const createRepo = async () => {
    try {
      const response = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: false
      });
      console.log('Repository created:', response.data);
    } catch (error) {
      console.error('Error creating repository:', error);
    }
  };

  const saveCode = async () => {
    try {
      const response = await octokit.repos.createOrUpdateFileContents({
        owner: username, // Use the provided GitHub username
        repo: repoName,
        path: filePath,
        message: commitMessage,
        content: btoa(code), // Use btoa to encode code content to Base64
      });
      console.log('Code saved:', response.data);
    } catch (error) {
      console.error('Error saving code:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">GitHub Code Editor</h1>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="token">
          GitHub Token
        </label>
        <input
          type="text"
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub Token"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
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
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Repository Option
        </label>
        <div className="flex items-center">
          <input
            type="radio"
            id="existing"
            name="repoOption"
            value="existing"
            checked={repoOption === 'existing'}
            onChange={(e) => setRepoOption(e.target.value)}
            className="mr-2 leading-tight"
          />
          <label htmlFor="existing" className="mr-4 text-gray-700">Use Existing Repository</label>
          <input
            type="radio"
            id="new"
            name="repoOption"
            value="new"
            checked={repoOption === 'new'}
            onChange={(e) => setRepoOption(e.target.value)}
            className="mr-2 leading-tight"
          />
          <label htmlFor="new" className="text-gray-700">Create New Repository</label>
        </div>
      </div>
      {repoOption === 'new' && (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repoName">
            Repository Name
          </label>
          <div className="flex">
            <input
              type="text"
              id="repoName"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="Repository Name"
              className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            <button
              onClick={createRepo}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline"
            >
              Create
            </button>
          </div>
        </div>
      )}
      {repoOption === 'existing' && (
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
      >
        Save Code to GitHub
      </button>
    </div>
  );
}

export default GitIntegration;
