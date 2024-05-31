import React, { useState } from 'react';
import MonacoEditor from "@monaco-editor/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GitIntegration = () => {
  const [code, setCode] = useState('// type your code here');
  const [filePath, setFilePath] = useState('index.js');
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderStructure, setFolderStructure] = useState([]);

  const handleFolderSelect = async () => {
    try {
      // Prompt user to select a directory
      const dirHandle = await window.showDirectoryPicker();
      setFolderHandle(dirHandle);
      const files = await readDirectory(dirHandle);
      setFolderStructure(files);
      toast.success('Folder selected successfully!');
    } catch (error) {
      console.error('Error accessing directory:', error);
      toast.error('Failed to access directory.');
    }
  };

  const readDirectory = async (dirHandle) => {
    const files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        files.push({ name: entry.name, kind: 'file', handle: entry });
      } else if (entry.kind === 'directory') {
        const subFiles = await readDirectory(entry);
        files.push({ name: entry.name, kind: 'directory', files: subFiles });
      }
    }
    return files;
  };

  const saveCodeToFile = async () => {
    if (!folderHandle) {
      toast.error('No folder selected!');
      return;
    }
    try {
      const fileHandle = await folderHandle.getFileHandle(filePath, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(code);
      await writable.close();
      toast.success('File saved successfully!');
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Local Code Editor</h1>
      <ToastContainer />
      <div className="text-center mb-6">
        <button variant="contained"className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={handleFolderSelect}>
          Select Folder
        </button>
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
      <button
        onClick={saveCodeToFile}
        className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Save Code to Local File
      </button>
    </div>
  );
};

export default GitIntegration;
