import React, { useState } from 'react';
import './App.css';
import Chat from './Chat';

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      onLogin(username);
    }
  };

  return (
    <div className="login-container">
      <h1>Welcome to Codorachat</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button type="submit" disabled={!username}>
          Join Chat
        </button>
      </form>
    </div>
  );
}


function App() {
  const [username, setUsername] = useState('');

  if (!username) {
    return <LoginScreen onLogin={setUsername} />;
  }

  return (
    <div className="App">
      <Chat username={username} />
    </div>
  );
}

export default App;
