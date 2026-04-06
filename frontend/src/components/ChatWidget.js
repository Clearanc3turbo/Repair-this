import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import API from "../lib/api";
import { MessageSquare, X, Send, Wrench } from "lucide-react";

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!user) return null;

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setSending(true);
    try {
      const { data } = await API.post("/chat", { message: text, session_id: sessionId });
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#FF3B30] text-white flex items-center justify-center shadow-lg hover:bg-[#D93025] transition-colors"
          data-testid="chat-toggle-btn"
        >
          <MessageSquare className="h-6 w-6" strokeWidth={1.5} />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white border border-[#E5E5EA] shadow-2xl flex flex-col" data-testid="chat-panel">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5EA] bg-[#F7F7F9]">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-[#FF3B30]" strokeWidth={1.5} />
              <span className="font-heading text-sm font-bold text-[#0F0F13]">FixBook AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-[#6C6C75] hover:text-[#0F0F13] transition-colors" data-testid="chat-close-btn">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Wrench className="h-8 w-8 text-[#E5E5EA] mx-auto mb-3" />
                <p className="font-body text-sm text-[#6C6C75]">Hi! I can help diagnose issues and estimate repair costs. What device needs fixing?</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 text-sm font-body ${
                  m.role === "user"
                    ? "bg-[#0F0F13] text-white"
                    : "bg-[#F7F7F9] text-[#0F0F13] border border-[#E5E5EA]"
                }`} data-testid={`chat-message-${i}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#F7F7F9] border border-[#E5E5EA] px-4 py-2.5 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#6C6C75] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#6C6C75] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#6C6C75] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[#E5E5EA] p-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Describe your issue..."
                className="flex-1 text-sm font-body border border-[#E5E5EA] px-3 py-2.5 focus:outline-none focus:border-[#0F0F13] transition-colors"
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="bg-[#FF3B30] text-white p-2.5 hover:bg-[#D93025] transition-colors disabled:opacity-30"
                data-testid="chat-send-btn"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
