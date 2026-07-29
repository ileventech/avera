'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Inbox, Edit3, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import type { InboxMessage } from '@/lib/supabase/useMessages';
import { relativeDate } from '@/lib/relativeDate';
import { initials } from '@/lib/supabase/useCurrentUser';

interface MessagesPanelProps {
  open: boolean;
  onClose: () => void;
  messages: InboxMessage[];
  loading: boolean;
  unreadCount: number;
  markRead: (id: string) => void;
  send: (recipientEmail: string, body: string) => Promise<{ error: string | null }>;
}

const AVATAR_COLORS = [
  '#1E3A8A', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0284C7', '#BE185D'
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function MessagesPanel({
  open, onClose, messages, loading, unreadCount, markRead, send,
}: MessagesPanelProps) {
  const [view, setView] = useState<'inbox' | 'thread' | 'compose'>('inbox');
  const [activeMsg, setActiveMsg] = useState<InboxMessage | null>(null);
  const [composeEmail, setComposeEmail] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeError, setComposeError] = useState('');
  const [sending, setSending] = useState(false);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  // Reset to inbox view when panel closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => { setView('inbox'); setActiveMsg(null); }, 300);
    }
  }, [open]);

  // Focus compose textarea when switching to compose
  useEffect(() => {
    if (view === 'compose') {
      setTimeout(() => composeRef.current?.focus(), 50);
    }
  }, [view]);

  const openThread = (msg: InboxMessage) => {
    markRead(msg.id);
    setActiveMsg(msg);
    setView('thread');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposeError('');
    setSending(true);
    const { error } = await send(composeEmail, composeBody);
    setSending(false);
    if (error) { setComposeError(error); return; }
    setComposeEmail('');
    setComposeBody('');
    setView('inbox');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(15,23,42,0.25)',
          backdropFilter: 'blur(2px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '420px', maxWidth: '100vw',
          background: 'white',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderLeft: '1px solid #E5E9F2',
        }}
      >
        {/* ── Panel Header ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #F1F5F9',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {view !== 'inbox' && (
              <button
                onClick={() => setView('inbox')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px' }}
                title="Back to inbox"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={16} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px', lineHeight: 1 }}>
                  {view === 'compose' ? 'New Message' : view === 'thread' ? 'Message' : 'Messages'}
                </div>
                {view === 'inbox' && unreadCount > 0 && (
                  <div style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600, marginTop: '2px' }}>{unreadCount} unread</div>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'inbox' && (
              <button
                onClick={() => setView('compose')}
                title="New Message"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px',
                  background: '#2563EB', color: 'white', border: 'none',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Edit3 size={13} /> New
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '7px', borderRadius: '8px' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* INBOX VIEW */}
          {view === 'inbox' && (
            <div style={{ flex: 1 }}>
              {loading && (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E5E9F2', borderTop: '3px solid #2563EB', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <div style={{ color: '#94A3B8', fontSize: '13px' }}>Loading messages…</div>
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <Inbox size={24} color="#94A3B8" />
                  </div>
                  <div style={{ fontWeight: 600, color: '#475569', marginBottom: '6px' }}>No messages yet</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8' }}>Send a message to a teammate to get started</div>
                  <button
                    onClick={() => setView('compose')}
                    style={{ marginTop: '20px', padding: '9px 18px', borderRadius: '8px', background: '#2563EB', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Compose Message
                  </button>
                </div>
              )}

              {!loading && messages.map(m => {
                const name = m.sender?.full_name || m.sender?.email || 'Unknown';
                const color = avatarColor(name);
                return (
                  <div
                    key={m.id}
                    onClick={() => openThread(m)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #F8FAFC',
                      cursor: 'pointer',
                      display: 'flex', gap: '12px',
                      background: m.read ? 'transparent' : '#F0F7FF',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseOut={e => { e.currentTarget.style.background = m.read ? 'transparent' : '#F0F7FF'; }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: color, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {initials(name, m.sender?.email ?? '')}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: m.read ? 500 : 700, color: '#0F172A', fontSize: '13px' }}>{name}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', flexShrink: 0, marginLeft: '8px' }}>{relativeDate(m.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.body}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!m.read && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', flexShrink: 0, marginTop: '6px' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* THREAD VIEW */}
          {view === 'thread' && activeMsg && (() => {
            const name = activeMsg.sender?.full_name || activeMsg.sender?.email || 'Unknown';
            const color = avatarColor(name);
            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Sender info bar */}
                <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, flexShrink: 0 }}>
                    {initials(name, activeMsg.sender?.email ?? '')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{activeMsg.sender?.email}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8', fontSize: '11px' }}>
                    <CheckCheck size={13} /> {relativeDate(activeMsg.created_at)}
                  </div>
                </div>

                {/* Message body */}
                <div style={{ padding: '24px 20px', flex: 1 }}>
                  <div style={{
                    background: '#F8FAFC', borderRadius: '12px', padding: '16px 18px',
                    border: '1px solid #E5E9F2', lineHeight: 1.6,
                    fontSize: '14px', color: '#0F172A', whiteSpace: 'pre-wrap',
                  }}>
                    {activeMsg.body}
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '12px' }}>
                    <Check size={13} /> Message read
                  </div>
                </div>

                {/* Quick reply hint */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => {
                      setComposeEmail(activeMsg.sender?.email ?? '');
                      setComposeBody('');
                      setView('compose');
                    }}
                    style={{
                      width: '100%', padding: '10px', borderRadius: '8px',
                      border: '1px solid #E5E9F2', background: 'white',
                      color: '#475569', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <Send size={14} /> Reply to {name.split(' ')[0]}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* COMPOSE VIEW */}
          {view === 'compose' && (
            <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
                <input
                  type="email"
                  required
                  placeholder="teammate@company.com"
                  value={composeEmail}
                  onChange={e => setComposeEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #E5E9F2', borderRadius: '8px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                    transition: 'border 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E9F2'; }}
                />
              </div>

              <div style={{ marginBottom: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                <textarea
                  ref={composeRef}
                  required
                  placeholder="Write your message here…"
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  style={{
                    flex: 1, minHeight: '180px', padding: '12px',
                    border: '1px solid #E5E9F2', borderRadius: '8px',
                    fontSize: '14px', resize: 'none', outline: 'none',
                    lineHeight: 1.6, boxSizing: 'border-box',
                    transition: 'border 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E9F2'; }}
                />
              </div>

              {composeError && (
                <div style={{ padding: '10px 12px', background: '#FEE2E2', borderRadius: '8px', color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>
                  {composeError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setView('inbox')}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E9F2', background: 'white', color: '#64748B', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    flex: 2, padding: '10px', borderRadius: '8px',
                    background: sending ? '#93C5FD' : '#2563EB', color: 'white',
                    border: 'none', fontSize: '13px', fontWeight: 600,
                    cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    transition: 'background 0.15s',
                  }}
                >
                  <Send size={14} /> {sending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        {view === 'inbox' && !loading && messages.length > 0 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #F1F5F9',
            fontSize: '12px', color: '#94A3B8', textAlign: 'center',
            flexShrink: 0,
          }}>
            {messages.length} message{messages.length !== 1 ? 's' : ''} · {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
