
import React, { useState, useEffect } from 'react';
import { db } from './db';
import { ArrowRight, UserPlus, LogIn, Loader2, AlertTriangle, MailCheck, RefreshCw, ChevronLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (username: string, data: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const providerType = db.getProviderType();

  useEffect(() => {
    const lastUser = localStorage.getItem('ideal_twin_last_username');
    if (lastUser) {
        setUsername(lastUser);
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await db.login(username, password);
        if (result.success && result.data) {
          localStorage.setItem('ideal_twin_last_username', result.username || username);
          onLogin(result.username || username, result.data);
        } else if (result.message === 'email_not_confirmed') {
          setError('Váš e-mail ešte nebol potvrdený. Prosím, skontrolujte si schránku.');
          setEmail(username); // Predpokladáme, že login je email
          setIsAwaitingVerification(true);
        } else {
          setError(result.message || 'Prihlásenie zlyhalo. Skontrolujte email a heslo.');
        }
      } else {
        if (!firstName || !lastName || !email || !dateOfBirth || !username || !password) {
            setError('Prosím vyplňte všetky polia.');
            setLoading(false);
            return;
        }

        const result = await db.register({
            username,
            password,
            firstName,
            lastName,
            email,
            dateOfBirth
        });
        
        if (result.success) {
          if (result.message === 'verification_required') {
              setIsAwaitingVerification(true);
          } else {
              const loginResult = await db.login(username, password);
              if (loginResult.success && loginResult.data) {
                 onLogin(username, loginResult.data);
              } else {
                 setIsLogin(true);
                 setError('Registrácia úspešná. Prosím, prihláste sa.');
              }
          }
        } else {
          setError(result.message || 'Registrácia zlyhala.');
        }
      }
    } catch (err) {
      console.error(err);
      setError("Vyskytla sa neočakávaná chyba pripojenia.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    const targetEmail = isLogin ? username : email;
    const result = await db.resendVerificationEmail(targetEmail);
    setLoading(false);
    if (result.success) {
      setResendCooldown(60);
      alert("Verifikačný e-mail bol znova odoslaný.");
    } else {
      setError(result.message || "Nepodarilo sa odoslať e-mail.");
    }
  };

  const inputClass = "w-full bg-canvas border border-txt-light/30 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-txt dark:bg-dark-canvas dark:text-txt-dark dark:border-txt-light/10";

  if (isAwaitingVerification) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans relative dark:bg-dark-canvas">
            <div className="bg-surface w-full max-w-md p-8 rounded-2xl shadow-sm border border-txt-light/10 my-8 text-center dark:bg-dark-surface dark:border-txt-light/10">
                <div className="w-20 h-20 bg-primary-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6 dark:bg-primary/10">
                    <MailCheck size={40} />
                </div>
                <h2 className="text-2xl font-bold text-txt mb-3 dark:text-txt-dark">Overte svoj e-mail</h2>
                <p className="text-txt-muted mb-8 dark:text-txt-dark-muted">
                    Poslali sme vám verifikačný odkaz na adresu <span className="font-semibold text-primary">{isLogin ? username : email}</span>. Bez overenia sa váš Twin neaktivuje.
                </p>
                
                <div className="space-y-4">
                  <button 
                      onClick={handleResend}
                      disabled={loading || resendCooldown > 0}
                      className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                      {resendCooldown > 0 ? `Znovu odoslať o ${resendCooldown}s` : 'Znovu odoslať e-mail'}
                  </button>

                  <button 
                      onClick={() => { setIsAwaitingVerification(false); setIsLogin(true); setError(''); }}
                      className="w-full bg-canvas text-txt-muted py-3 rounded-xl font-semibold border border-txt-light/20 flex items-center justify-center gap-2 hover:bg-txt-light/5 transition-all dark:bg-dark-canvas dark:text-txt-dark-muted dark:border-txt-light/10"
                  >
                      <ChevronLeft size={18} /> Späť na prihlásenie
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                  </div>
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 font-sans relative dark:bg-dark-canvas">
      <div className="bg-surface w-full max-w-md p-8 rounded-2xl shadow-sm border border-txt-light/10 my-8 dark:bg-dark-surface dark:border-txt-light/10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 relative mb-2">
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                <circle cx="40" cy="50" r="35" className="fill-secondary" fillOpacity="0.85" />
                <circle cx="60" cy="50" r="35" className="fill-primary" fillOpacity="0.85" />
                <circle cx="82" cy="22" r="7" className="fill-habit stroke-surface stroke-2 dark:stroke-dark-surface" />
             </svg>
          </div>
          <h1 className="text-2xl font-bold text-txt dark:text-txt-dark">IdealTwin</h1>
          <p className="text-txt-muted text-sm mt-1 dark:text-txt-dark-muted">Tvoj virtuálny spoločník</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Meno</label>
                        <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} placeholder="Ján" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Priezvisko</label>
                        <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} placeholder="Novák" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Email</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="jan@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Používateľské meno</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="janko123" />
                </div>
            </div>
          )}

          {isLogin && (
            <div>
              <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Email</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} placeholder="email@example.com" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-txt-muted mb-1 dark:text-txt-dark-muted">Heslo</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm mt-4 dark:bg-primary dark:hover:bg-primary/90">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isLogin ? 'Prihlásiť sa' : 'Vytvoriť účet'} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 text-center pt-6 border-t border-txt-light/20 dark:border-txt-light/10">
          <p className="text-txt-muted text-sm dark:text-txt-dark-muted">{isLogin ? 'Ešte nemáš účet?' : 'Už máš vytvorený účet?'}</p>
          <button onClick={() => { setError(''); setIsLogin(!isLogin); setIsAwaitingVerification(false); }} className="text-primary font-semibold text-sm mt-1 hover:text-primary-hover flex items-center justify-center gap-1 mx-auto transition-colors">
            {isLogin ? <><UserPlus size={14} /> Zaregistruj sa zadarmo</> : <><LogIn size={14} /> Prihlásiť sa</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
