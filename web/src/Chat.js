import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Connect to the server. In a real app, you would use a configuration for the server URL.
const socket = io('http://localhost:3000');

function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    // Listen for incoming messages
    socket.on('chat message', (msg) => {
      setMessages(prevMessages => [...prevMessages, msg]);
    });

    socket.on('typing', (typerUsername) => {
      if (typerUsername !== username) {
        setTypingUsers((prevTypingUsers) => {
          if (!prevTypingUsers.includes(typerUsername)) {
            return [...prevTypingUsers, typerUsername];
          }
          return prevTypingUsers;
        });
      }
    });

    socket.on('stop typing', (typerUsername) => {
      setTypingUsers((prevTypingUsers) =>
        prevTypingUsers.filter((user) => user !== typerUsername)
      );
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.off('chat message');
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input) {
      socket.emit('chat message', { username: username, text: input });
      setInput('');
      // Immediately stop typing after sending a message
      if (isTyping) {
        socket.emit('stop typing', username);
        setIsTyping(false);
        if (typingTimeout.current) {
          clearTimeout(typingTimeout.current);
        }
      }
    }
  };

  const handleTyping = (e) => {
    const text = e.target.value;
    setInput(text);

    if (!isTyping) {
      socket.emit('typing', username);
      setIsTyping(true);
    }

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop typing', username);
      setIsTyping(false);
    }, 1000); // 1 second debounce
  };

  return (
    <div className="chat-container">
      <div className="header">
        <h1>Codorachat Web</h1>
      </div>
      <ul id="messages">
        {messages.map((msg, index) => (
          <li key={index} className={msg.username === username ? 'message-item my-message' : 'message-item other-message'}>
            <div className="message-content">
              {msg.username !== username && <div className="username">{msg.username}</div>}
              <div className="text">{msg.text}</div>
            </div>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} is typing...
        </div>
      )}
      <form id="form" onSubmit={handleSubmit}>
        <input
          id="input"
          autoComplete="off"
          value={input}
          onChange={handleTyping}
          placeholder="Type a message..."
        />
        <button>Send</button>
      </form>
    </div>
  );
}

export default Chat;
