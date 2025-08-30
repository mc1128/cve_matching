import { useState, useEffect } from 'react';

interface DashboardStats {
  dailyStats: Array<{
    date: string;
    daily_count: number;
  }>;
  totalStats: {
    total_chats: number;
    unique_users: number;
  };
}

interface ChatMessage {
  prompt: string;
  response: string;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: chatInput,
          userId: 'dashboard-user'
        }),
      });

      const data = await response.json();
      
      setChatHistory(prev => [...prev, {
        prompt: chatInput,
        response: data.response,
        timestamp: data.timestamp
      }]);
      
      setChatInput('');
      fetchStats(); // 통계 업데이트
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <h1>AWS Bedrock Dashboard</h1>
      
      {/* 통계 섹션 */}
      <div className="stats-section">
        <h2>Statistics</h2>
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Chats</h3>
              <p>{stats.totalStats.total_chats}</p>
            </div>
            <div className="stat-card">
              <h3>Unique Users</h3>
              <p>{stats.totalStats.unique_users}</p>
            </div>
          </div>
        )}
      </div>

      {/* 채팅 섹션 */}
      <div className="chat-section">
        <h2>AI Chat</h2>
        <div className="chat-history">
          {chatHistory.map((chat, index) => (
            <div key={index} className="chat-message">
              <div className="user-message">
                <strong>You:</strong> {chat.prompt}
              </div>
              <div className="ai-message">
                <strong>AI:</strong> {chat.response}
              </div>
            </div>
          ))}
        </div>
        
        <div className="chat-input">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI something..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
