import React from 'react';
import GitIntegration from './queryEditor';
import './index.css';

function App() {
  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-xl">Data Migration</h1>
      </header>
      <main className="p-4">
        <GitIntegration />
      </main>
    </div>
  );
}

export default App;
