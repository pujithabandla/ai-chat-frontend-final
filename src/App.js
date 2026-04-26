import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_URL = "https://ai-chat-backend-r8jz.onrender.com/chat";

function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [loginName, setLoginName] = useState("");

  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("chats");
    return saved
      ? JSON.parse(saved)
      : [{ id: Date.now(), title: "New Chat", messages: [] }];
  });

  const [activeChat, setActiveChat] = useState(() =>
    chats.length ? chats[0].id : null
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // ✅ FIX (removes Vercel error)
  const currentChat = useMemo(
    () => chats.find((c) => c.id === activeChat),
    [chats, activeChat]
  );

  const messages = useMemo(
    () => currentChat?.messages || [],
    [currentChat]
  );

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setMessages = (newMessages) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat ? { ...chat, messages: newMessages } : chat
      )
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: username, message: userText }),
      });

      const data = await res.json();
      const reply = data.response || "No response";

      let current = "";

      for (let i = 0; i < reply.length; i++) {
        current += reply[i];

        setMessages([
          ...newMessages,
          { role: "assistant", content: current },
        ]);

        await new Promise((r) => setTimeout(r, 8));
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Error connecting" },
      ]);
    }

    setLoading(false);
  };

  const createNewChat = () => {
    const newChat = { id: Date.now(), title: "New Chat", messages: [] };
    setChats([newChat, ...chats]);
    setActiveChat(newChat.id);
  };

  const deleteChat = (id) => {
    const filtered = chats.filter((c) => c.id !== id);

    if (filtered.length === 0) {
      const fresh = { id: Date.now(), title: "New Chat", messages: [] };
      setChats([fresh]);
      setActiveChat(fresh.id);
    } else {
      setChats(filtered);
      setActiveChat(filtered[0].id);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const login = () => {
    if (!loginName.trim()) return;
    localStorage.setItem("username", loginName);
    setUsername(loginName);
  };

  const logout = () => {
    localStorage.removeItem("username");
    setUsername("");
  };

  // 🔐 LOGIN UI
  if (!username) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-left">
            <img
              src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png"
              alt="AI Bot"
            />
          </div>

          <div className="login-right">
            <h2>AI Chat</h2>

            <input
              placeholder="Enter your name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />

            <button onClick={login}>Start Chat</button>
          </div>
        </div>
      </div>
    );
  }

  // 💬 MAIN UI
  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="profile">
          {username}
          <button onClick={logout}>Logout</button>
        </div>

        <button className="new-chat" onClick={createNewChat}>
          + New Chat
        </button>

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === activeChat ? "active" : ""}`}
            onClick={() => setActiveChat(chat.id)}
          >
            {chat.title}
            <span
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
            >
              ✕
            </span>
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="app">
        <div className="header">AI Chat Assistant</div>

        <div className="chat-container">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              <button onClick={() => copyText(msg.content)}>Copy</button>
            </div>
          ))}

          {loading && <div className="typing">Typing...</div>}
          <div ref={chatEndRef}></div>
        </div>

        <div className="input-container">
          <input
            value={input}
            placeholder="Type your message..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;