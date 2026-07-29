'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
};

type Profile = { id: string; email: string; full_name: string };

export type InboxMessage = MessageRow & { sender: Profile | null };

export function useMessages(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setMessages([]); setLoading(false); return; }
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (msgError) { setError(msgError.message); setLoading(false); return; }

    const rows = (msgs ?? []) as MessageRow[];
    const senderIds = [...new Set(rows.map(m => m.sender_id))];
    let profiles: Profile[] = [];
    if (senderIds.length > 0) {
      const { data: profileRows } = await supabase.from('profiles').select('id,email,full_name').in('id', senderIds);
      profiles = (profileRows ?? []) as Profile[];
    }
    const profileById = new Map(profiles.map(p => [p.id, p]));
    setMessages(rows.map(m => ({ ...m, sender: profileById.get(m.sender_id) ?? null })));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, read: true } : m)));
    await supabase.from('messages').update({ read: true }).eq('id', id);
  }, [supabase]);

  const send = useCallback(async (recipientEmail: string, body: string) => {
    if (!userId) return { error: 'Not signed in' };
    const { data: recipient, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', recipientEmail.trim().toLowerCase())
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (!recipient) return { error: 'No teammate found with that email.' };
    const { error: insertError } = await supabase.from('messages').insert({ sender_id: userId, recipient_id: recipient.id, body });
    if (insertError) return { error: insertError.message };
    await refresh();
    return { error: null };
  }, [supabase, userId, refresh]);

  const unreadCount = messages.filter(m => !m.read).length;

  return { messages, loading, error, unreadCount, markRead, send, refresh };
}
