import React, { useState } from 'react';
import { UserProfile, AvatarConfig, AvatarSkin, AvatarHairColor, AvatarBottomType, AvatarClothingColor, AvatarTopType, AvatarShoesType, AvatarGlasses, AvatarHeadwear } from './types';
import { CATEGORY_UNLOCKS } from './gamificationConfig';
import { getPresetAvatarUrl } from './geminiService';
import { Lock, User, Shirt, Smile, Save, Sparkles, Loader2, Footprints, Glasses, GraduationCap } from 'lucide-react';
import { translations, Language } from './translations';
import Avatar from './Avatar';

interface TwinProfileProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  lang?: Language;
}

const TwinProfile: React.FC<TwinProfileProps> = ({ user, setUser, lang = 'sk' }) => {
  const t = (key: string) => translations[lang][key] || key;
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
    setIsImageLoading(true); // Loading starts here
    try {
        const aiUrl = await getPresetAvatarUrl(
            level,
            localConfig.gender,
            localConfig.skin,
            localConfig.hairStyle,
            localConfig.hairColor,
            localConfig.eyeColor,
            localConfig.glasses,
            localConfig.headwear,
            localConfig.topType,
            localConfig.topColor,
            localConfig.bottomType,
            localConfig.bottomColor,
            localConfig.shoesType,
            localConfig.shoesColor
        );
        setUser({ ...user, avatarUrl: aiUrl, avatarConfig: localConfig });
        // isGenerating ends, but isImageLoading remains true until img.onLoad
    } catch (e) {
        console.error("AI Generation failed", e);
        setIsImageLoading(false);
    } finally {
        setIsGenerating(false);
    }
  };

  const save = () => {
      setUser({ ...user, avatarConfig: localConfig });
      alert(t('profile.saved'));
  };

  const SectionHeader = ({ icon: Icon, title, req }: { icon: any, title: string, req: number }) => (
    <div className="flex items-center justify-between mb-4 border-b border-txt-light/10 pb-2 dark:border-white/10">
        <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-tighter text-sm">
            <Icon size={16} className="text-primary" /> {title}
        </h3>
        {isLocked(req) && (
            <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold dark:bg-red-900/20">
                <Lock size={10} /> Odomkne sa na Lvl {req}
            </span>
        )}
    </div>
  );

  const showLoader = isGenerating || isImageLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
      {/* Visual Preview */}
      <div className="bg-surface p-8 rounded-[3rem] border border-txt-light/10 shadow-xl dark:bg-dark-surface flex flex-col items-center justify-center relative min-h-[500px]">
         
         {showLoader && (
             <div className="absolute inset-0 z-50 bg-surface/90 dark:bg-dark-surface/90 flex flex-col items-center justify-center rounded-[3rem] text-center p-6 backdrop-blur-sm">
                 <Loader2 size={48} className="text-primary animate-spin mb-4" />
                 <h4 className="font-black uppercase tracking-tighter text-txt dark:text-white">Generujem Twin Dvojníka</h4>
                 <p className="text-sm text-txt-muted mt-2">Tvoj Twin sa práve generuje cez AI... Prosím počkaj.</p>
             </div>
         )}
         
         <div className={isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}>
             <Avatar user={{ ...user, avatarConfig: localConfig }} size="xl" />
             {user.avatarUrl && (
                 <img 
                    src={user.avatarUrl} 
                    className="hidden" 
                    onLoad={() => setIsImageLoading(false)} 
                    onError={() => setIsImageLoading(false)}
                 />
             )}
         </div>
         
         <div className="mt-10 flex gap-4 w-full justify-center">
            <button 
                onClick={handleGeneratePreview}
                disabled={showLoader}
                className="bg-canvas border border-primary/20 text-primary px-8 py-4 rounded-2xl font-bold shadow-sm flex items-center gap-2 hover:bg-primary-50 transition-all disabled:opacity-50"
            >
                <Sparkles size={20} />
                {t('profile.generate')}
            </button>
            <button 
                onClick={save} 
                disabled={showLoader}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl flex items-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-50"
            >
                <Save size={20} /> {t('profile.save')}
            </button>
         </div>
      </div>

      {/* Config Panel */}
      <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-4 custom-scrollbar">
          {/* Level 1 */}
          <section className="bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm">
              <SectionHeader icon={User} title="Základ" req={CATEGORY_UNLOCKS.BASIC} />
              <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => updateConfig('gender', 'Male')} className={`py-3 rounded-xl border-2 font-bold transition-all ${localConfig.gender === 'Male' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>Muž</button>
                  <button onClick={() => updateConfig('gender', 'Female')} className={`py-3 rounded-xl border-2 font-bold transition-all ${localConfig.gender === 'Female' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>Žena</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                  {['Fair', 'Light', 'Medium', 'Olive', 'Brown', 'Dark'].map((s: any) => (
                      <button key={s} onClick={() => updateConfig('skin', s)} className={`py-2 rounded-lg border-2 text-[10px] font-bold ${localConfig.skin === s ? 'border-primary bg-primary/5' : 'border-transparent bg-canvas dark:bg-dark-canvas'}`}>{s}</button>
                  ))}
              </div>
          </section>

          {/* Level 2 */}
          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.CLOTHING) ? 'opacity-50' : ''}`}>
              <SectionHeader icon={Shirt} title="Oblečenie" req={CATEGORY_UNLOCKS.CLOTHING} />
              <div className="grid grid-cols-2 gap-3">
                  <select disabled={isLocked(2)} value={localConfig.topType} onChange={(e) => updateConfig('topType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="T-Shirt">Tričko</option>
                      <option value="Hoodie">Mikina</option>
                      <option value="Shirt">Košeľa</option>
                  </select>
                  <select disabled={isLocked(2)} value={localConfig.bottomType} onChange={(e) => updateConfig('bottomType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="Jeans">Džínsy</option>
                      <option value="Sweatpants">Tepláky</option>
                      <option value="Shorts">Šortky</option>
                  </select>
              </div>
          </section>

          {/* Level 3 */}
          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.SHOES) ? 'opacity-50' : ''}`}>
              <SectionHeader icon={Footprints} title="Obuv" req={CATEGORY_UNLOCKS.SHOES} />
              <select disabled={isLocked(3)} value={localConfig.shoesType} onChange={(e) => updateConfig('shoesType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                  <option value="Sneakers">Tenisky</option>
                  <option value="Boots">Topánky</option>
                  <option value="Sandals">Sandále</option>
              </select>
          </section>

          {/* Level 4 */}
          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.GLASSES) ? 'opacity-50' : ''}`}>
              <SectionHeader icon={Glasses} title="Okuliare" req={CATEGORY_UNLOCKS.GLASSES} />
              <select disabled={isLocked(4)} value={localConfig.glasses} onChange={(e) => updateConfig('glasses', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                  <option value="None">Bez okuliarov</option>
                  <option value="Reading">Dioptrické</option>
                  <option value="Sunglasses">Slnečné</option>
              </select>
          </section>

          {/* Level 5 */}
          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.HEADWEAR) ? 'opacity-50' : ''}`}>
              <SectionHeader icon={GraduationCap} title="Pokrývky hlavy" req={CATEGORY_UNLOCKS.HEADWEAR} />
              <select disabled={isLocked(5)} value={localConfig.headwear} onChange={(e) => updateConfig('headwear', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                  <option value="None">Žiadne</option>
                  <option value="Cap">Šiltovka</option>
                  <option value="Hat">Klobúk</option>
              </select>
          </section>
      </div>
    </div>
  );
};

export default TwinProfile;
