import React, { useState } from 'react';
import { UserProfile, AvatarConfig, AvatarSkin, AvatarHairColor, AvatarHairStyle, AvatarBottomType, AvatarClothingColor, AvatarTopType, AvatarShoesType, AvatarGlasses, AvatarHeadwear } from './types';
import { CATEGORY_UNLOCKS } from './gamificationConfig';
import { getPresetAvatarUrl } from './geminiService';
import { Lock, User, Shirt, Smile, Save, Sparkles, Loader2, Footprints, Glasses, GraduationCap, Scissors, Palette } from 'lucide-react';
import { translations, Language } from './translations';
import Avatar from './Avatar';

interface TwinProfileProps {
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  lang?: Language;
}

const TwinProfile: React.FC<TwinProfileProps> = ({ user, setUser, lang = 'sk' }) => {
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
        // Construct temporary user object for prediction
        const tempUser = { ...user, avatarConfig: localConfig };
        const avatarUrl = await getPresetAvatarUrl(tempUser);
        setUser({ ...user, avatarUrl: avatarUrl, avatarConfig: localConfig });
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
                <Lock size={10} /> Lvl {req}
            </span>
        )}
    </div>
  );

  const showLoader = isGenerating || isImageLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-20">
      <div className="bg-surface p-8 rounded-[3rem] border border-txt-light/10 shadow-xl dark:bg-dark-surface flex flex-col items-center justify-center relative min-h-[500px]">
         
         {showLoader && (
             <div className="absolute inset-0 z-50 bg-surface/90 dark:bg-dark-surface/90 flex flex-col items-center justify-center rounded-[3rem] text-center p-6 backdrop-blur-sm">
                 <Loader2 size={48} className="text-primary animate-spin mb-4" />
                 <h4 className="font-black uppercase tracking-tighter text-txt dark:text-white">Formujem identitu</h4>
                 <p className="text-sm text-txt-muted mt-2 font-bold">Váš 3D Twin ožíva...</p>
             </div>
         )}
         
         <div className={isImageLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-1000'}>
             <Avatar user={{ ...user, avatarConfig: localConfig }} size="xl" />
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

      <div className="space-y-6 overflow-y-auto max-h-[75vh] pr-4 custom-scrollbar">
          <section className="bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm">
              <SectionHeader icon={User} title="Telo a Pleť" req={CATEGORY_UNLOCKS.BASIC} />
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

          <section className="bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm">
              <SectionHeader icon={Scissors} title="Vlasy a Strih" req={CATEGORY_UNLOCKS.BASIC} />
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <select value={localConfig.hairStyle} onChange={(e) => updateConfig('hairStyle', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="Short">Krátke</option>
                      <option value="Long">Dlhé</option>
                      <option value="Straight">Rovné</option>
                      <option value="Curly">Kučeravé</option>
                      <option value="Spiky">Spiky (Pichľavé)</option>
                      <option value="Bob">Bob (Krátky strih)</option>
                      <option value="Ponytail">Cop</option>
                      <option value="Wavy">Vlnité</option>
                      <option value="Bald">Bald (Bez vlasov)</option>
                  </select>
                  <select value={localConfig.hairColor} onChange={(e) => updateConfig('hairColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="Brown">Hnedé</option>
                      <option value="Blonde">Blond</option>
                      <option value="Black">Čierne</option>
                      <option value="Red">Ryšavé</option>
                      <option value="Gray">Sivé</option>
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.CLOTHING) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Shirt} title="Vrchný diel" req={CATEGORY_UNLOCKS.CLOTHING} />
              <div className="grid grid-cols-2 gap-3 mb-4">
                  <select disabled={isLocked(2)} value={localConfig.topType} onChange={(e) => updateConfig('topType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="T-Shirt">Tričko</option>
                      <option value="Hoodie">Mikina</option>
                      <option value="Shirt">Košeľa (Elegantná)</option>
                      <option value="Jacket">Bunda</option>
                  </select>
                  <select disabled={isLocked(2)} value={localConfig.topColor} onChange={(e) => updateConfig('topColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      {['White', 'Black', 'Blue', 'Red', 'Green', 'Gray', 'Pink', 'Yellow'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.CLOTHING) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Palette} title="Spodný diel" req={CATEGORY_UNLOCKS.CLOTHING} />
              <div className="grid grid-cols-2 gap-3">
                  <select disabled={isLocked(2)} value={localConfig.bottomType} onChange={(e) => updateConfig('bottomType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      <option value="Jeans">Džínsy</option>
                      <option value="Sweatpants">Tepláky</option>
                      <option value="Shorts">Šortky</option>
                      <option value="Skirt">Sukňa</option>
                      <option value="Leggings">Legíny</option>
                  </select>
                  <select disabled={isLocked(2)} value={localConfig.bottomColor} onChange={(e) => updateConfig('bottomColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none">
                      {['Denim', 'Black', 'Gray', 'Blue', 'White', 'Black'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.SHOES) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Footprints} title="Obuv" req={CATEGORY_UNLOCKS.SHOES} />
              <div className="grid grid-cols-2 gap-3">
                <select disabled={isLocked(3)} value={localConfig.shoesType} onChange={(e) => updateConfig('shoesType', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                    <option value="Sneakers">Tenisky</option>
                    <option value="Boots">Topánky</option>
                    <option value="Sandals">Sandále</option>
                    <option value="Heels">Lodičky</option>
                </select>
                <select disabled={isLocked(3)} value={localConfig.shoesColor} onChange={(e) => updateConfig('shoesColor', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                   {['White', 'Black', 'Blue', 'Brown'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
          </section>

          <section className={`bg-surface p-6 rounded-3xl border border-txt-light/10 dark:bg-dark-surface shadow-sm transition-opacity ${isLocked(CATEGORY_UNLOCKS.GLASSES) ? 'opacity-50 pointer-events-none' : ''}`}>
              <SectionHeader icon={Glasses} title="Doplnky" req={CATEGORY_UNLOCKS.GLASSES} />
              <div className="grid grid-cols-2 gap-3">
                <select disabled={isLocked(4)} value={localConfig.glasses} onChange={(e) => updateConfig('glasses', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                    <option value="None">Bez okuliarov</option>
                    <option value="Reading">Dioptrické</option>
                    <option value="Sunglasses">Slnečné</option>
                </select>
                <select disabled={isLocked(5)} value={localConfig.headwear} onChange={(e) => updateConfig('headwear', e.target.value)} className="bg-canvas dark:bg-dark-canvas p-3 rounded-xl text-xs font-bold border-none outline-none w-full">
                    <option value="None">Bez pokrývky</option>
                    <option value="Cap">Šiltovka</option>
                    <option value="Hat">Klobúk</option>
                    <option value="Beanie">Čiapka</option>
                </select>
              </div>
          </section>
      </div>
    </div>
  );
};

export default TwinProfile;
