import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAuth } from '../../auth/context/AuthContext.jsx';
import { chatService } from '../services/chatService.js';

export const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const targetUserId = searchParams.get('targetUserId') || '';
  const patientId = searchParams.get('patientId') || '';

  const refreshThreads = async () => {
    const data = await chatService.getThreads();
    setThreads(data);

    if (!activeThreadId && data.length > 0) {
      setActiveThreadId(String(data[0].id));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setIsLoadingThreads(true);
      setError('');

      try {
        if (targetUserId) {
          const contextType = patientId ? 'patient_request' : 'general';
          const thread = await chatService.createOrGetThread({
            participantUserId: targetUserId,
            contextType,
            contextRefId: patientId || undefined,
          });

          if (isMounted && thread?.id) {
            setActiveThreadId(String(thread.id));
          }
        }

        if (isMounted) {
          await refreshThreads();
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || 'Failed to load chats.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingThreads(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [targetUserId, patientId]);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      setIsLoadingMessages(true);

      try {
        const response = await chatService.getMessages(activeThreadId, { page: 1, limit: 100 });

        if (isMounted) {
          setMessages(response.data || []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError?.response?.data?.message || 'Failed to load messages.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      }
    };

    loadMessages();

    const pollId = setInterval(loadMessages, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollId);
    };
  }, [activeThreadId]);

  const activeThread = useMemo(
    () => threads.find((thread) => String(thread.id) === String(activeThreadId)) || null,
    [threads, activeThreadId],
  );

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!activeThreadId || !draft.trim() || isSending) {
      return;
    }

    const content = draft.trim();
    setDraft('');
    setIsSending(true);

    try {
      await chatService.sendMessage(activeThreadId, { content });
      const response = await chatService.getMessages(activeThreadId, { page: 1, limit: 100 });
      setMessages(response.data || []);
      await refreshThreads();
    } catch (requestError) {
      setDraft(content);
      setError(requestError?.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">Communication</p>
        <h2>Chat</h2>
      </header>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="panel-grid" style={{ gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: '1rem' }}>
        <article className="panel-card">
          <h3>Conversations</h3>
          {isLoadingThreads ? <p className="muted-text">Loading threads...</p> : null}
          <ul className="list-clean">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  className={`inline-link-btn ${String(thread.id) === String(activeThreadId) ? 'active' : ''}`}
                  onClick={() => setActiveThreadId(String(thread.id))}
                >
                  {thread.otherParticipant?.name || 'User'}
                </button>
                <p className="muted-text">{thread.lastMessagePreview || 'No messages yet'}</p>
              </li>
            ))}
          </ul>
          {!isLoadingThreads && threads.length === 0 ? (
            <p className="muted-text">No chats yet. Start from donor or patient list.</p>
          ) : null}
        </article>

        <article className="panel-card">
          <h3>{activeThread ? `Chat with ${activeThread.otherParticipant?.name || 'User'}` : 'Messages'}</h3>

          <div style={{ minHeight: '320px', maxHeight: '420px', overflowY: 'auto', padding: '0.5rem 0' }}>
            {isLoadingMessages ? <p className="muted-text">Loading messages...</p> : null}

            {!isLoadingMessages && messages.length === 0 ? (
              <p className="muted-text">No messages yet. Say hello.</p>
            ) : null}

            {messages.map((message) => {
              const isMine = String(message.senderUserId) === String(user?.id || user?._id || '');

              return (
                <div key={message.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '0.5rem' }}>
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '0.75rem',
                      background: isMine ? 'var(--color-accent, #dc2626)' : 'rgba(255,255,255,0.08)',
                      color: isMine ? '#fff' : 'inherit',
                    }}
                  >
                    <p>{message.content}</p>
                    <p className="muted-text" style={{ marginTop: '0.35rem' }}>
                      {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="toolbar" style={{ marginTop: '0.75rem' }}>
            <label htmlFor="chatMessage">Message</label>
            <input
              id="chatMessage"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeThreadId ? 'Type a message' : 'Select a conversation'}
              disabled={!activeThreadId || isSending}
            />
            <button type="submit" className="inline-link-btn" disabled={!activeThreadId || !draft.trim() || isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
};
