import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Bot,
  User,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';

export const AiAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 Maritime Audit Intelligence Assistant Ready\n\nI am grounded directly in your **cryptographic SHA-256 maritime operations ledger**. I can answer specific questions regarding container journeys, carrier manifests, officer signatures, active anomalies, and tamper integrity.\n\n*Zero hallucinations: All answers are backed by immutable audit blocks.*`,
      insights: [
        'Query containers (e.g. C102, MSCU-749201)',
        'Investigate suspicious activities and security violations',
        'Verify blockchain hash integrity in real-time'
      ],
      suggestedFollowUps: [
        'Show me the history of container C102',
        'Which containers have active anomalies?',
        'Who loaded container MSCU-749201?',
        'Summarize the audit history of ship MV Ocean Star',
        'Verify audit trail integrity'
      ]
    }
  ]);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedPrompts = [
    'Show me the history of container C102',
    'Who loaded container MSCU-749201?',
    'Which containers have active anomalies?',
    'Why was container C102 flagged?',
    'Summarize the audit history of ship MV Ocean Star',
    'Verify audit trail integrity'
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || prompt;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.ai.query(textToSend);
      const assistantMessage = {
        role: 'assistant',
        content: res.answer,
        relevantAudits: res.relevantAudits || [],
        insights: res.insights || [],
        suggestedFollowUps: res.suggestedFollowUps || []
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to process query: ${err.message}. Please check system connectivity and retry.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            NATURAL LANGUAGE MARITIME AUDIT SEARCH
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={22} color="var(--cyan)" />
            <span>AI Maritime Audit Assistant</span>
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Ask questions in plain English to interrogate the immutable container & ship ledger
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="btn btn-secondary btn-sm"
        >
          <RotateCcw size={13} />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Suggested Question Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
        {predefinedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '11px', whiteSpace: 'nowrap', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="maritime-card" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '75%' : '90%'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #00b4d8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={20} color="#fff" />
              </div>
            )}

            <div style={{
              background: msg.role === 'user' ? 'linear-gradient(135deg, #0284c7 0%, #0096c7 100%)' : 'var(--bg-secondary)',
              color: '#f8fafc',
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Message Content formatted with Markdown lines */}
              <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {msg.content}
              </div>

              {/* Insights Bullets */}
              {msg.insights?.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Key Intelligence Takeaways:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                    {msg.insights.map((ins, idx) => (
                      <li key={idx}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relevant Audit Citations */}
              {msg.relevantAudits?.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Audits Cited:
                  </span>
                  {msg.relevantAudits.map((aId, aIdx) => (
                    <span key={aIdx} style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', background: 'rgba(0, 180, 216, 0.15)', color: 'var(--cyan)', padding: '2px 6px', borderRadius: '4px' }}>
                      {aId}
                    </span>
                  ))}
                </div>
              )}

              {/* Follow-up Prompts */}
              {msg.suggestedFollowUps?.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {msg.suggestedFollowUps.map((su, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(su)}
                      style={{
                        background: 'rgba(2, 132, 199, 0.15)',
                        border: '1px solid rgba(0, 180, 216, 0.3)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      &rarr; {su}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--cyan)', fontSize: '13px' }}>
            <span className="pulse-dot" />
            <span>Scanning SHA-256 ledger blocks and compiling ground-truth answer...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          display: 'flex',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        <input
          type="text"
          className="input-control"
          placeholder="Ask a question (e.g. 'Show me the history of container C102' or 'Who loaded box MSCU-749201?')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ background: 'var(--bg-secondary)', border: 'none', fontSize: '14px' }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="btn btn-primary"
          style={{ padding: '0 24px' }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
};
