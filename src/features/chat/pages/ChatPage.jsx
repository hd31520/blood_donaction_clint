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
          setError(requestError?.response?.data?.message || 'চ্যাট লোড করা যায়নি।');
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
          setError(requestError?.response?.data?.message || 'মেসেজ লোড করা যায়নি।');
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
      setError(requestError?.response?.data?.message || 'মেসেজ পাঠানো যায়নি।');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="feature-page reveal">
      <header className="feature-header">
        <p className="eyebrow">যোগাযোগ</p>
        <h2>চ্যাট</h2>
      </header>

      {error ? <p className="auth-error">{error}</p> : null}

      <div className="panel-grid chat-layout">
        <article className="panel-card chat-thread-panel">
          <h3>কথোপকথন</h3>
          {isLoadingThreads ? <p className="muted-text">চ্যাট লোড হচ্ছে...</p> : null}
          <ul className="list-clean chat-thread-list">
            {threads.map((thread) => (
              <li key={thread.id} className="chat-thread-item">
                <button
                  type="button"
                  className={`inline-link-btn chat-thread-btn ${String(thread.id) === String(activeThreadId) ? 'active' : ''}`}
                  onClick={() => setActiveThreadId(String(thread.id))}
                >
                  {thread.otherParticipant?.name || 'ব্যবহারকারী'}
                </button>
                <p className="muted-text chat-thread-preview">{thread.lastMessagePreview || 'এখনও মেসেজ নেই'}</p>
              </li>
            ))}
          </ul>
          {!isLoadingThreads && threads.length === 0 ? (
            <p className="muted-text">এখনও কোনো চ্যাট নেই। রোগী বা রক্তদাতা তালিকা থেকে শুরু করুন।</p>
          ) : null}
        </article>

        <article className="panel-card chat-messages-panel">
          <h3>{activeThread ? `${activeThread.otherParticipant?.name || 'ব্যবহারকারী'} এর সাথে চ্যাট` : 'মেসেজ'}</h3>

          <div className="chat-message-scroll">
            {isLoadingMessages ? <p className="muted-text">মেসেজ লোড হচ্ছে...</p> : null}

            {!isLoadingMessages && messages.length === 0 ? (
              <p className="muted-text">এখনও মেসেজ নেই। প্রথম মেসেজ পাঠান।</p>
            ) : null}

            {messages.map((message) => {
              const isMine = String(message.senderUserId) === String(user?.id || user?._id || '');

              return (
                <div key={message.id} className={`chat-message-row ${isMine ? 'mine' : 'other'}`}>
                  <div className={`chat-message-bubble ${isMine ? 'mine' : 'other'}`}>
                    <p>{message.content}</p>
                    <p className="muted-text chat-message-meta">
                      {message.createdAt ? new Date(message.createdAt).toLocaleString('bn-BD') : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} className="toolbar chat-composer">
            <label htmlFor="chatMessage" className="chat-composer-label">মেসেজ</label>
            <input
              id="chatMessage"
              className="chat-composer-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeThreadId ? 'মেসেজ লিখুন' : 'একটি কথোপকথন নির্বাচন করুন'}
              disabled={!activeThreadId || isSending}
            />
            <button type="submit" className="inline-link-btn chat-send-btn" disabled={!activeThreadId || !draft.trim() || isSending}>
              {isSending ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </button>
          </form>
        </article>
      </div>
    </section>
  );
};
