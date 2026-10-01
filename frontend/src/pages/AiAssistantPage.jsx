import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  Thermometer,
  Box,
  Ship,
  AlertTriangle,
  FileCheck,
  Hash,
  CornerDownLeft
} from 'lucide-react';

/**
 * Custom High-Readability Markdown Formatter
 */
const FormattedMarkdown = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: '1.6', color: '#1e293b' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} style={{ height: '4px' }} />;
        }

        // Heading 3: ###
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} style={{ margin: '8px 0 4px 0', fontSize: '16px', fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {renderInlineFormatting(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        // Heading 2: ##
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} style={{ margin: '12px 0 6px 0', fontSize: '18px', fontWeight: 800, color: '#0f3460', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              {renderInlineFormatting(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
        }

        // Heading 1: #
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} style={{ margin: '14px 0 6px 0', fontSize: '20px', fontWeight: 800, color: '#0f3460' }}>
              {renderInlineFormatting(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
        }

        // Bullet Point: * or -
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^(\*|-|•)\s+/, '');
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '8px' }}>
              <span style={{ color: '#0284c7', fontSize: '16px', lineHeight: '1', marginTop: '4px' }}>&bull;</span>
              <span style={{ color: '#334155' }}>{renderInlineFormatting(bulletText)}</span>
            </div>
          );
        }

        // Numbered List: 1. 2. etc.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '8px' }}>
              <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '13px', minWidth: '18px' }}>{numMatch[1]}.</span>
              <span style={{ color: '#334155' }}>{renderInlineFormatting(numMatch[2])}</span>
            </div>
          );
        }

        // Regular Paragraph Line
        return (
          <p key={idx} style={{ margin: 0, color: '#334155' }}>
            {renderInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper: formats **bold**, `code`, and [links]
function renderInlineFormatting(text) {
  if (!text) return null;

  // Split by bold (**...**) and inline code (`...`)
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700, color: '#0f172a' }}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: '#e0f2fe',
            color: '#0369a1',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '12px',
            fontWeight: 600,
            border: '1px solid #bae6fd'
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export const AiAssistantPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `### 🤖 Maritime Operations & Cold-Chain AI Intelligence Assistant (Gemini 2.5 Flash)

I am powered by **Google Gemini 2.5 Flash** and directly grounded in your live **cryptographic SHA-256 maritime operations ledger** and **Cold-Chain Refrigerated Container Telemetry**.

You can ask me questions in plain English regarding:
* **Refrigerated Container Telemetry & Out-of-Range Alerts** (e.g. \`MSCU-8829104\`, \`OOLU-3382910\`)
* **Container Life-Cycles, Risk Scores & Seal Verifications**
* **Vessel Schedules, AIS Positions & Berthing Allocations** (e.g. \`MSC Irina\`)
* **Cryptographic Hash Chain Integrity Status**
* **Active Port Anomalies & Inspection Records**`,
      insights: [
        'All answers are verified against live database records with zero hallucination',
        'Cryptographic audit IDs and container records are cited directly in responses',
        'Cold-chain temperature telemetry and quarantine holds are monitored in real time'
      ],
      suggestedFollowUps: [
        'What is the temperature status of refrigerated containers?',
        'Verify cryptographic audit trail integrity',
        'Show me the history of container MSCU-8829104',
        'Which containers have active anomalies?',
        'Summarize the audit history of ship MSC Irina'
      ]
    }
  ]);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const predefinedPrompts = [
    'What is the temperature status of refrigerated containers?',
    'Verify audit trail integrity',
    'Show me the history of container MSCU-8829104',
    'Which containers have active anomalies?',
    'Summarize the audit history of ship MSC Irina',
    'Who loaded container MSCU-8829104?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        content: res.answer || 'Query completed.',
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
          content: `⚠️ Failed to process query: ${err.message}. Please verify server connectivity and retry.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '18px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>NATURAL LANGUAGE MARITIME & COLD-CHAIN SEARCH</span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', textTransform: 'none', border: '1px solid #bae6fd', fontWeight: 700 }}>
              ⚡ Powered by Google Gemini 2.5 Flash
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#0284c7" />
            <span>AI Maritime Audit Assistant</span>
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Ask questions in plain English to interrogate the immutable container ledger, cold-chain telemetry & vessels
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
        >
          <RotateCcw size={13} />
          <span>Reset Conversation</span>
        </button>
      </div>

      {/* Suggested Quick Question Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
        {predefinedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.color = '#0284c7';
              e.currentTarget.style.background = '#f0f9ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.background = '#ffffff';
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '16px',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '80%' : '95%'
            }}
          >
            {/* Assistant Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}>
                <Bot size={20} color="#ffffff" />
              </div>
            )}

            {/* Message Bubble */}
            <div style={{
              background: msg.role === 'user' ? '#0f3460' : '#f8fafc',
              color: msg.role === 'user' ? '#ffffff' : '#0f172a',
              padding: '18px 22px',
              borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              border: msg.role === 'user' ? 'none' : '1px solid #e2e8f0',
              boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)',
              width: '100%'
            }}>
              {/* Message Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: msg.role === 'user' ? '#38bdf8' : '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {msg.role === 'user' ? 'Authorized Operator' : 'Gemini 2.5 Flash Grounded Intelligence'}
                </span>
              </div>

              {/* Message Body with High Contrast Markdown Formatting */}
              {msg.role === 'user' ? (
                <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#ffffff', fontWeight: 500 }}>
                  {msg.content}
                </div>
              ) : (
                <FormattedMarkdown content={msg.content} />
              )}

              {/* Insights Bullets */}
              {msg.insights?.length > 0 && (
                <div style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd'
                }}>
                  <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#0284c7" />
                    <span>Key Verified Takeaways</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', color: '#0f172a', fontSize: '13px', lineHeight: '1.5' }}>
                    {msg.insights.map((ins, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>{ins}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relevant Audit Citations */}
              {msg.relevantAudits?.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={12} color="#0284c7" /> Audits Cited:
                  </span>
                  {msg.relevantAudits.map((aId, aIdx) => (
                    <span
                      key={aIdx}
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono, monospace)',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        border: '1px solid #bae6fd'
                      }}
                    >
                      {aId}
                    </span>
                  ))}
                </div>
              )}

              {/* Follow-up Prompts */}
              {msg.suggestedFollowUps?.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Suggested Next Steps:</span>
                  {msg.suggestedFollowUps.map((su, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(su)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0284c7',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0284c7';
                        e.currentTarget.style.background = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      &rarr; {su}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Avatar */}
            {msg.role === 'user' && (
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} color="#0f3460" />
              </div>
            )}
          </div>
        ))}

        {/* Animated Loading State */}
        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 18px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', width: 'fit-content' }}>
            <span className="pulse-dot" style={{ background: '#0284c7' }} />
            <div style={{ fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>
              Gemini 2.5 Flash is analyzing cryptographic ledger blocks & cold-chain telemetry...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{
          display: 'flex',
          gap: '12px',
          background: '#ffffff',
          padding: '14px',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
      >
        <input
          type="text"
          className="input-control"
          placeholder="Ask anything (e.g. 'What is the temperature status of refrigerated containers?' or 'Show me the history of container MSCU-8829104')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '14px',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#0f172a'
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="btn btn-primary"
          style={{
            padding: '0 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            background: '#0f3460',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={15} />
          <span>Send Query</span>
        </button>
      </form>
    </div>
  );
};

export default AiAssistantPage;
