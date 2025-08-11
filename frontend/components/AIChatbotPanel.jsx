import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../App";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const API_URL = "http://localhost:8080/api/ai/chat";

export default function AIChatbotPanel() {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load conversation history from localStorage
    const saved = localStorage.getItem('chatbot-messages');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        sender: "bot",
        text: "Hi! 👋 I'm your AI Career Assistant. I can help you with career advice, job search tips, resume improvements, and more. What would you like to know?",
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('chat-streak') || '0');
  });
  const [badges, setBadges] = useState(() => {
    const saved = localStorage.getItem('user-badges');
    return saved ? JSON.parse(saved) : [];
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chatbot-messages', JSON.stringify(messages));
  }, [messages]);

  // Save streak and badges to localStorage
  useEffect(() => {
    localStorage.setItem('chat-streak', streak.toString());
    localStorage.setItem('user-badges', JSON.stringify(badges));
  }, [streak, badges]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results.transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Gamification functions
  const addBadge = (badgeType, badgeName) => {
    if (!badges.some(b => b.type === badgeType)) {
      const newBadge = { type: badgeType, name: badgeName, earned: new Date().toISOString() };
      setBadges(prev => [...prev, newBadge]);
      
      // Show celebration message
      const celebrationMessage = {
        id: Date.now() + Math.random(),
        sender: "bot",
        text: `🎉 **Congratulations!** You've earned the "${badgeName}" badge! Keep up the great work!`,
      };
      setMessages(prev => [...prev, celebrationMessage]);
    }
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastChat = localStorage.getItem('last-chat-date');
    
    if (lastChat !== today) {
      setStreak(prev => prev + 1);
      localStorage.setItem('last-chat-date', today);
      
      // Award badges based on streak
      if (streak + 1 === 3) addBadge('streak-3', 'Chat Enthusiast');
      if (streak + 1 === 7) addBadge('streak-7', 'Weekly Warrior');
      if (streak + 1 === 30) addBadge('streak-30', 'Monthly Master');
    }
  };

  // Voice functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*|__|`/g, ''));
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // File upload function
  const handleFileUpload = async (event) => {
    const file = event.target.files;
    if (!file) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: `📎 Uploaded file: ${file.name}`,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8080/api/ai/upload-analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.reply || "File uploaded successfully!",
      };

      setMessages(prev => [...prev, botMessage]);
      addBadge('file-upload', 'Document Analyzer');

    } catch (error) {
      console.error("File upload error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Sorry, I couldn't analyze the file. Please try again.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // Export Chat as PDF
  const exportChatPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('AI Career Assistant Chat History', 20, yPosition);
    yPosition += 20;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    messages.forEach((message) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      const sender = message.sender === 'user' ? 'You' : 'AI Assistant';
      const text = `${sender}: ${message.text.replace(/\*\*|__|`/g, '')}`;
      
      const splitText = doc.splitTextToSize(text, 170);
      
      if (yPosition + (splitText.length * 5) > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(splitText, 20, yPosition);
      yPosition += (splitText.length * 5) + 10;
    });
    
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`ai-chat-history-${timestamp}.pdf`);
  };

  // Send message with conversation memory
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    updateStreak();

    try {
      // Get last 10 messages for context
      const recentMessages = messages.slice(-10);
      
      const token = localStorage.getItem("jwt");
const response = await fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  },
  body: JSON.stringify({ message: text.trim(), history: recentMessages }),
});


      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || data.response || "Sorry, I couldn't generate a response. Please try again.";

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: botReply,
      };

      setMessages((prev) => [...prev, botMessage]);

      // Award badges
      const totalMessages = messages.filter(m => m.sender === 'user').length + 1;
      if (totalMessages === 1) addBadge('first-chat', 'First Conversation');
      if (totalMessages === 10) addBadge('chat-10', 'Chatty Cathy');
      if (totalMessages === 50) addBadge('chat-50', 'Chat Master');

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const clearChat = () => {
    const welcomeMessage = {
      id: 1,
      sender: "bot",
      text: "Chat cleared! How can I help you today?",
    };
    setMessages([welcomeMessage]);
    localStorage.removeItem('chatbot-messages');
  };

  const supportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const supportsSpeechSynthesis = 'speechSynthesis' in window;

  return (
    <>
      {/* Floating Chat Button with Gamification */}
      <button
        onClick={toggleChat}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          border: "none",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
          color: "white",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = "0 6px 25px rgba(99, 102, 241, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.3)";
        }}
        title={`AI Assistant (🔥 ${streak} day streak)`}
      >
        {isOpen ? "✕" : "🤖"}
        {streak > 0 && (
          <div style={{ fontSize: "10px", marginTop: "-2px" }}>🔥{streak}</div>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "420px",
            height: "100vh",
            background: isDark ? "#1f2937" : "#ffffff",
            borderLeft: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
            zIndex: 1001,
            display: "flex",
            flexDirection: "column",
            animation: "slideInFromRight 0.3s ease-out",
          }}
        >
          {/* Enhanced Header with Gamification */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
              color: "white",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>🤖</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
                    AI Career Assistant
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                    🔥 {streak} day streak -  {badges.length} badges
                  </p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
                title="Close chat"
              >
                ✕
              </button>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                title="Upload document for analysis"
              >
                📎 Upload
              </button>
              <button
                onClick={exportChatPDF}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                title="Export chat as PDF"
              >
                📄 Export
              </button>
              <button
                onClick={clearChat}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  color: "white",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                title="Clear chat"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Messages with Rich Rendering */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              background: isDark ? "#111827" : "#f9fafb",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "12px 16px",
                    borderRadius: message.sender === "user" ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                    background: message.sender === "user"
                        ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                        : isDark ? "#374151" : "#e5e7eb",
                    color: message.sender === "user" ? "white" : isDark ? "#f9fafb" : "#1f2937",
                    fontSize: "14px",
                    lineHeight: "1.4",
                    wordWrap: "break-word",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    position: "relative",
                  }}
                >
                  {message.sender === "bot" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code: ({node, inline, className, children, ...props}) => (
                          <code
                            style={{
                              background: isDark ? "#2d3748" : "#f3f4f6",
                              borderRadius: 4,
                              padding: inline ? "2px 4px" : "8px 12px",
                              fontFamily: "monospace",
                              fontSize: "95%",
                              display: inline ? "inline" : "block",
                              whiteSpace: inline ? "nowrap" : "pre-wrap",
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        ),
                        table: ({children}) => (
                          <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "8px",
                            marginBottom: "8px",
                          }}>
                            {children}
                          </table>
                        ),
                        th: ({children}) => (
                          <th style={{
                            border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
                            padding: "6px 8px",
                            background: isDark ? "#2d3748" : "#f7fafc",
                            fontWeight: "600",
                            fontSize: "12px",
                          }}>
                            {children}
                          </th>
                        ),
                        td: ({children}) => (
                          <td style={{
                            border: `1px solid ${isDark ? "#4a5568" : "#e2e8f0"}`,
                            padding: "6px 8px",
                            fontSize: "12px",
                          }}>
                            {children}
                          </td>
                        ),
                        strong: ({children}) => (
                          <strong style={{ fontWeight: "700" }}>{children}</strong>
                        ),
                        ul: ({children}) => (
                          <ul style={{ marginLeft: "16px", marginTop: "4px", marginBottom: "4px" }}>
                            {children}
                          </ul>
                        ),
                        ol: ({children}) => (
                          <ol style={{ marginLeft: "16px", marginTop: "4px", marginBottom: "4px" }}>
                            {children}
                          </ol>
                        ),
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>{message.text}</div>
                  )}
                  
                  {/* Voice Controls for Bot Messages */}
                  {message.sender === "bot" && supportsSpeechSynthesis && (
                    <button
                      onClick={() => speakText(message.text)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(0, 0, 0, 0.1)",
                        border: "none",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "12px",
                        cursor: "pointer",
                        opacity: 0.7,
                      }}
                      title="Read aloud"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "20px 20px 20px 6px",
                    background: isDark ? "#374151" : "#e5e7eb",
                    color: isDark ? "#f9fafb" : "#1f2937",
                    fontSize: "14px",
                    fontStyle: "italic",
                  }}
                >
                  <span style={{ display: "inline-block", animation: "typing 1.5s infinite" }}>
                    Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: "16px",
              borderTop: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
              background: isDark ? "#1f2937" : "#ffffff",
              display: "flex",
              gap: "8px",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your career..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "24px",
                border: `1px solid ${isDark ? "#4b5563" : "#d1d5db"}`,
                background: isDark ? "#374151" : "#ffffff",
                color: isDark ? "#f9fafb" : "#1f2937",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDark ? "#4b5563" : "#d1d5db";
              }}
            />
            
            {/* Voice Input Button */}
            {supportsSpeechRecognition && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
                style={{
                  padding: "12px",
                  borderRadius: "50%",
                  border: "none",
                  background: isListening ? "#ef4444" : "#6366f1",
                  color: "white",
                  fontSize: "14px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? "🛑" : "🎤"}
              </button>
            )}

            {/* Stop Speaking Button */}
            {supportsSpeechSynthesis && isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                style={{
                  padding: "12px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#ef4444",
                  color: "white",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Stop speaking"
              >
                🔇
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                padding: "12px 16px",
                borderRadius: "24px",
                border: "none",
                background: input.trim() && !isLoading
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : isDark ? "#4b5563" : "#d1d5db",
                color: "white",
                fontSize: "14px",
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                fontWeight: "600",
              }}
            >
              {isLoading ? "..." : "→"}
            </button>
          </form>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes typing {
          0%, 20% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
