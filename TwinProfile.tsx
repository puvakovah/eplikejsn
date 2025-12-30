import React, { useState } from 'react';
import { UserProfile, AvatarConfig } from './types';
import { CATEGORY_UNLOCKS } from './gamificationConfig';
import { getPresetAvatarUrl } from './geminiService';
import { Lock, User, Shirt, Save, Sparkles, Loader2, Footprints, Scissors, Palette } from 'lucide-react';
import { translations, Language } from './translations';
import Avatar from './Avatar';

interface TwinProfileProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  lang?: Language;
}

const TwinProfile: React.FC<TwinProfileProps> = ({ user, setUser, lang = 'en' }) => {
  const t = (key: string) => translations[lang][key as keyof typeof translations.en] || key;
  const level = user.twinLevel;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [localConfig, setLocalConfig] = useState<AvatarConfig>(user.avatarConfig || {
      gender: 'Male', skin: 'Medium', hairColor: 'Brown', hairStyle: 'Short', eyeColor: 'Brown',
      glasses: 'None', headwear: 'None', topType: 'T-Shirt', topColor: 'Blue', 
      bottomType: 'Jeans', bottomColor: 'Blue', shoesType: 'Sneakers', shoesColor: 'White'
  });

  const updateConfig = (key: keyof AvatarConfig, val: string) => {
      setLocalConfig({ ...localConfig, [key]: val });
  };

  const isLocked = (requiredLevel: number) => level < requiredLevel;

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setIsImageLoading(true); 
    try {
        const tempUser = { ...user, avatarConfig: localConfig };
        const avatarUrl = await getPresetAvatarUrl(tempUser, 'happy', lang);
        setUser({ ...user, avatarUrl: avatarUrl, avatarConfig: localConfig });
    } catch (e) {
        setIsImageLoading(false);
    } finally {
        setIsGenerating(false);
    }
  };

  const SectionHeader = ({ icon: Icon, title, req }: { icon: any, title: string, req: number }) => (
    <div className="flex items-center justify-between mb-4 border-b border-txt-light/10 pb-2 dark:border-white/10">
        <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-tighter text-sm">
            <Icon size={16} className="text-primary" /> {title}
        </h3>
        {isLocked(req) && (
            <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold dark:bg-red-900/20">
                <Lock size={10} /> Lvl {req}
            </span>
        )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
      <div className="bg-surface p-8 rounded-[3rem] border border-txt-light/10 shadow-xl dark:bg-dark-surface flex flex-col items-center justify-center relative min-h-[500px]">
         {(isGenerating || isImageLoading) && (
             <div className="absolute inset-0 z-50 bg-surface/90 dark:bg-dark-surface/90 flex flex-col items-center justify-center rounded-[3rem] text-center p-6 backdrop-blur-sm">
                 <Loader2 size={48} className="text-primary animate-spin mb-4" />
                 <h4 className="font-black uppercase tracking-tighter text-txt dark:text-white">{t('profile.forming')}</h4>
                 <p className="text-sm text-txt-muted mt-2 font-bold">{t('profile.forming_desc')}</p>
             </div>
         )}
         <div className={isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}>
             <Avatar user={{ ...user, avatarConfig: localConfig }} size="xl" />
         </div>
         <div className="mt-10 flex gap-4 w-full justify-center">
            <button onClick={handleGeneratePreview} disabled={isGenerating} className="bg-canvas border border-primary/20 text-primary px-8 py-4 rounded-2xl font-bold shadow-sm flex items-center gap-2 hover:bg-primary-50 transition-all disabled:opacity-50">
                <Sparkles size={20} /> {t('profile.generate')}
            </button>
            <button onClick={() => { setUser({ ...user, avatarConfig: localConfig }); alert(t('profile.saved')); }} className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-primary-hover transition-all">
                <Save size={20} /> {t('profile.save')}
            </button>
         </div>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-4 custom-scrollbar">
          <section className="bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm">
              <SectionHeader icon={User} title={t('profile.section.body')} req={CATEGORY_UNLOCKS.BASIC} />
              <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => updateConfig('gender', 'Male')} className={`py-3 rounded-xl border-2 font-bold transition-all ${localConfig.gender === 'Male' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>{t('profile.gender.male')}</button>
                  <button onClick={() => updateConfig('gender', 'Female')} className={`py-3 rounded-xl border-2 font-bold transition-all ${localConfig.gender === 'Female' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>{t('profile.gender.female')}</button>
              </div>
          </section>

          <section className="bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm">
              <SectionHeader icon={Scissors} title={t('profile.section.hair')} req={CATEGORY_UNLOCKS.BASIC} />
              <div className="grid grid-cols-2 gap-3">
                  <select value={localConfig.hairStyle} onChange={(e) => updateConfig('hairStyle', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['Short', 'Long', 'Straight', 'Curly', 'Spiky', 'Bob', 'Ponytail', 'Wavy', 'Bald'].map(h => (
                          <option key={h} value={h}>{t(`avatar.hair.${h.toLowerCase()}`)}</option>
                      ))}
                  </select>
                  <select value={localConfig.hairColor} onChange={(e) => updateConfig('hairColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['Brown', 'Blonde', 'Black', 'Red', 'Gray'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm ${isLocked(CATEGORY_UNLOCKS.CLOTHING) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Shirt} title={t('profile.section.top')} req={CATEGORY_UNLOCKS.CLOTHING} />
              <div className="grid grid-cols-2 gap-3">
                  <select value={localConfig.topType} onChange={(e) => updateConfig('topType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['T-Shirt', 'Hoodie', 'Shirt', 'Jacket', 'TankTop'].map(t_ => (
                          <option key={t_} value={t_}>{t(`avatar.top.${t_.toLowerCase().replace('-', '')}`)}</option>
                      ))}
                  </select>
                  <select value={localConfig.topColor} onChange={(e) => updateConfig('topColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['White', 'Black', 'Blue', 'Red', 'Green', 'Gray', 'Pink', 'Yellow'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm ${isLocked(CATEGORY_UNLOCKS.CLOTHING) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Palette} title={t('profile.section.bottom')} req={CATEGORY_UNLOCKS.CLOTHING} />
              <div className="grid grid-cols-2 gap-3">
                  <select value={localConfig.bottomType} onChange={(e) => updateConfig('bottomType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['Jeans', 'Sweatpants', 'Shorts', 'Skirt', 'Leggings'].map(b => (
                          <option key={b} value={b}>{t(`avatar.bottom.${b.toLowerCase()}`)}</option>
                      ))}
                  </select>
                  <select value={localConfig.bottomColor} onChange={(e) => updateConfig('bottomColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold">
                      {['Denim', 'Black', 'Gray', 'Blue', 'White'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm ${isLocked(CATEGORY_UNLOCKS.SHOES) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Footprints} title={t('profile.section.shoes')} req={CATEGORY_UNLOCKS.SHOES} />
              <div className="grid grid-cols-2 gap-3">
                <select value={localConfig.shoesType} onChange={(e) => updateConfig('shoesType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold w-full">
                    {['Sneakers', 'Boots', 'Sandals', 'Heels'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={localConfig.shoesColor} onChange={(e) => updateConfig('shoesColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold w-full">
                   {['White', 'Black', 'Blue', 'Brown'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
          </section>
      </div>
    </div>
  );
};

export default TwinProfile;