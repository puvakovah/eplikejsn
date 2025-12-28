import React, { useState } from 'react';
import { UserProfile, InboxMessage } from './types';
import { Mail, Trash2, Star, Sparkles } from 'lucide-react';
import { translations, Language } from './translations';

interface InboxProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  lang?: Language;
}

const Inbox: React.FC<InboxProps> = ({ user, setUser, lang = 'sk' }) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);

  // Základný preklad pre UI prvky
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;

  /**
   * FUNKCIA PRE DYNAMICKÝ PREKLAD OBSAHU
   * 1. Vyhľadá kľúč v translations.ts
   * 2. Nahradí {name} menom používateľa
   * 3. Nahradí {email} emailom používateľa
   */
  const translateMailContent = (content: string) => {
    if (!content) return "";
    
    // Získame text z prekladov, ak existuje kľúč
    let translated = translations[lang][content as keyof typeof translations.en] || content;

    // Ak ide o reťazec, nahradíme dynamické polia
    if (typeof translated === 'string') {
      translated = translated
        .replace(/{name}/g, user.name || 'User')
        .replace(/{email}/g, user.email || '');
    }

    return translated;
  };

  const markAsRead = (msgId: string) => {
    const updatedMessages = user.messages.map(m => 
      m.id === msgId ? { ...m, read: true } : m
    );
    setUser({ ...user, messages: updatedMessages });
  };

  const deleteMessage = (msgId: string) => {
    if (window.confirm(t('inbox.delete_confirm'))) {
      const updatedMessages = user.messages.filter(m => m.id !== msgId);
      setUser({ ...user, messages: updatedMessages });
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
      }
    }
  };

  const handleSelect = (msg: InboxMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) markAsRead(msg.id);
  };

  const sortedMessages = [...(user.messages || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const unreadCount = sortedMessages.filter(m => !m.read).length;

  return (
    <div className="h-[calc(100vh-140px)] bg-surface rounded-2xl shadow-sm border border-txt-light/10 flex overflow-hidden animate-fade-in dark:bg-dark-surface dark:border-white/10">
      
      {/* List - Zoznam správ */}
      <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-txt-light/10 bg-canvas dark:bg-dark-canvas dark:border-white/10`}>
        <div className="p-4 border-b border-txt-light/10 flex justify-between items-center bg-surface dark:bg-dark-surface dark:border-white/10">
          <h2 className="font-bold text-txt flex items-center gap-2 dark:text-txt-dark">
            <Mail size={20} className="text-primary" />
            {t('inbox.title')}
          </h2>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
              {unreadCount} {t('inbox.new')}
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sortedMessages.length === 0 ? (
            <div className="p-8 text-center text-txt-muted dark:text-txt-dark-muted opacity-50">
              <Mail size={40} className="mx-auto mb-2" />
              <p className="text-sm">{t('inbox.empty')}</p>
            </div>
          ) : (
            sortedMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`w-full text-left p-4 border-b border-txt-light/10 hover:bg-surface transition-colors relative dark:border-white/5 dark:hover:bg-white/5
                  ${selectedMessage?.id === msg.id ? 'bg-surface border-l-4 border-l-primary dark:bg-white/5' : 'border-l-4 border-l-transparent'}
                  ${!msg.read ? 'bg-primary-50/20 dark:bg-primary/10 font-bold' : ''}
                `}
              >
                {!msg.read && <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>}
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] uppercase tracking-tighter text-txt-muted dark:text-gray-500">
                    {translateMailContent(msg.sender)}
                  </span>
                  <span className="text-[10px] text-txt-light dark:text-gray-600">
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm truncate mb-1 dark:text-txt-dark">
                  {translateMailContent(msg.subject)}
                </h4>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail - Obsah správy */}
      <div className={`${!selectedMessage ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-surface relative min-w-0 dark:bg-dark-surface`}>
        {selectedMessage ? (
          <>
            <button className="md:hidden p-4 text-sm font-bold border-b border-txt-light/10 dark:text-gray-400" onClick={() => setSelectedMessage(null)}>
               ← {t('inbox.back')}
            </button>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                   <h1 className="text-2xl font-black text-txt mb-4 dark:text-txt-dark">
                     {translateMailContent(selectedMessage.subject)}
                   </h1>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                       {translateMailContent(selectedMessage.sender)[0]}
                     </div>
                     <div>
                       <p className="text-sm font-bold dark:text-txt-dark">{translateMailContent(selectedMessage.sender)}</p>
                       <p className="text-[10px] text-txt-muted uppercase tracking-widest">{new Date(selectedMessage.date).toLocaleString()}</p>
                     </div>
                   </div>
                </div>
                <button onClick={() => deleteMessage(selectedMessage.id)} className="p-2 text-txt-muted hover:text-red-500 transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="border-t border-txt-light/10 pt-8 dark:border-white/10 dark:text-gray-300">
                 {/* Alerty pre typ správy */}
                 {selectedMessage.type === 'welcome' && (
                   <div className="flex items-center gap-2 bg-primary/10 text-primary p-3 rounded-xl mb-6 border border-primary/20">
                     <Sparkles size={18} />
                     <span className="text-xs font-bold uppercase">{t('inbox.welcome_alert')}</span>
                   </div>
                 )}

                 {/* Samotné telo správy */}
                 <div 
                    className="leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: translateMailContent(selectedMessage.body) }} 
                 />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
            <Mail size={60} />
            <p className="mt-4 font-bold uppercase tracking-widest text-xs">{t('inbox.select')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;