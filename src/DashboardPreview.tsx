/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Sparkles, 
  LogOut, 
  Gamepad2, 
  TrendingUp, 
  Shuffle, 
  Award, 
  ArrowRight, 
  User as UserIcon, 
  ShieldAlert, 
  RotateCw,
  Gift,
  Flame,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { LANGUAGES, TRANSLATIONS } from './languages';

interface DashboardPreviewProps {
  user: {
    username: string;
    email: string;
    balance: number;
  };
  onLogout: () => void;
}

export default function DashboardPreview({ user, onLogout }: DashboardPreviewProps) {
  const [activeTab, setActiveTab] = useState<'earn' | 'wheel' | 'withdraw'>('earn');
  const [balance, setBalance] = useState(user.balance);
  const [withdrawUsername, setWithdrawUsername] = useState(user.username);
  const [withdrawAmount, setWithdrawAmount] = useState('1000'); // 10 Robux is the minimum
  const [withdrawStatus, setWithdrawStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [payoutMethod, setPayoutMethod] = useState<'gamepass'>('gamepass');
  const [gamepassId, setGamepassId] = useState('');
  
  // Roblox games & gamepasses states
  const [robloxGames, setRobloxGames] = useState<any[]>([]);
  const [robloxGamepasses, setRobloxGamepasses] = useState<any[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [fetchingGames, setFetchingGames] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Roblox avatar states
  const [robloxAvatar, setRobloxAvatar] = useState<string | null>(null);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [taskToast, setTaskToast] = useState<string | null>(null);

  useEffect(() => {
    if (user.username) {
      fetch(`/api/roblox/avatar?username=${encodeURIComponent(user.username)}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Avatar not found');
        })
        .then((data) => {
          setUserAvatarUrl(data.avatarUrl);
        })
        .catch((err) => {
          console.error('Error fetching header Roblox avatar:', err);
        });
    }
  }, [user.username]);

  // Load games and gamepasses when withdraw username changes
  useEffect(() => {
    if (!withdrawUsername.trim()) {
      setRobloxGames([]);
      setRobloxGamepasses([]);
      setSelectedGameId('');
      setGamepassId('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setFetchingGames(true);
      try {
        const response = await fetch(`/api/roblox/games?username=${encodeURIComponent(withdrawUsername.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setRobloxGames(data.games || []);
          setRobloxGamepasses(data.gamepasses || []);
          if (data.games && data.games.length > 0) {
            setSelectedGameId(data.games[0].id);
            // Auto-select the first gamepass of the first game if exists
            const firstGamepasses = (data.gamepasses || []).filter((p: any) => p.universeId === data.games[0].id);
            if (firstGamepasses.length > 0) {
              setGamepassId(firstGamepasses[0].id);
            } else {
              setGamepassId('');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching Roblox games:', err);
      } finally {
        setFetchingGames(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [withdrawUsername]);

  // Active language state
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'tr';
  });
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.tr;

  const [livePayouts, setLivePayouts] = useState<any[]>([]);

  const fetchLivePayouts = async () => {
    try {
      const response = await fetch('/api/payout/feed');
      if (response.ok) {
        const data = await response.json();
        setLivePayouts(data.payouts || []);
      }
    } catch (err) {
      console.error('Error fetching live payouts:', err);
    }
  };

  useEffect(() => {
    fetchLivePayouts();
    const interval = setInterval(fetchLivePayouts, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!withdrawUsername.trim()) {
      setRobloxAvatar(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setFetchingAvatar(true);
      try {
        const response = await fetch(`/api/roblox/avatar?username=${encodeURIComponent(withdrawUsername.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setRobloxAvatar(data.avatarUrl);
        } else {
          setRobloxAvatar(null);
        }
      } catch (err) {
        console.error('Error fetching Roblox avatar:', err);
        setRobloxAvatar(null);
      } finally {
        setFetchingAvatar(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [withdrawUsername]);

  // Simulated spin state
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [wheelToast, setWheelToast] = useState<string | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);

  // Localized offers list
  const offersList = [
    { id: 'off_1', name: 'Rise of Kingdoms', payout: 3500, category: t.game, difficulty: t.difficultyHard, icon: '🏰' },
    { id: 'off_2', name: 'Solitaire Grand Harvest', payout: 1200, category: t.game, difficulty: t.difficultyMedium, icon: '🃏' },
    { id: 'off_3', name: 'Yandex Hızlı Anket', payout: 150, category: t.survey, difficulty: t.difficultyEasy, icon: '📝' },
    { id: 'off_4', name: 'TikTok Takip Et ve Beğen', payout: 80, category: t.social, difficulty: t.difficultyEasy, icon: '📱' },
  ];

  // Simulated local wheel prize pool
  const prizes = [5, 20, 50, 10, 100, 15, 30, 200];

  const handleSpin = async () => {
    if (hasSpunToday) {
      setWheelToast(t.wheelLimitError);
      setTimeout(() => setWheelToast(null), 5000);
      return;
    }
    setSpinning(true);
    setWheelToast(null);

    try {
      const response = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });

      const data = await response.json();

      if (!response.ok) {
        setSpinning(false);
        setWheelToast(data.error || t.connectionError);
        return;
      }

      // Wait 3 seconds to let visual animation finish nicely
      setTimeout(() => {
        setSpinResult(data.winningIndex);
        setSpinning(false);
        setBalance(data.newBalance);
        setHasSpunToday(true);
        setWheelToast(t.spunSuccess.replace('{prize}', data.prize.toString()));
        
        // Sync active user balance in localstorage
        const activeUser = localStorage.getItem('active_user');
        if (activeUser) {
          const updatedUser = { ...JSON.parse(activeUser), balance: data.newBalance };
          localStorage.setItem('active_user', JSON.stringify(updatedUser));
        }
      }, 3000);

    } catch (err) {
      setSpinning(false);
      setWheelToast(t.connectionError);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount);
    
    if (!withdrawUsername.trim()) {
      setWithdrawStatus({ type: 'error', message: t.robloxUserPlaceholder });
      return;
    }

    if (!gamepassId.trim()) {
      setWithdrawStatus({ type: 'error', message: lang === 'tr' ? 'Lütfen listelenen bir Gamepass seçin veya manuel olarak girin!' : 'Please select a listed Gamepass or enter it manually!' });
      return;
    }

    if (isNaN(amountNum) || amountNum < 1000) {
      setWithdrawStatus({ type: 'error', message: lang === 'tr' ? 'Minimum çekim tutarı 10 Robux (1000 Coin) değerinde olmalıdır!' : 'Minimum withdrawal amount must be 10 Robux (1000 Coins)!' });
      return;
    }

    if (amountNum > balance) {
      setWithdrawStatus({ type: 'error', message: lang === 'tr' ? 'Hesabınızda bu miktarda çekim yapacak kadar Coin yok!' : 'Insufficient balance!' });
      return;
    }

    setWithdrawStatus({ type: 'loading', message: t.searchingUser });

    try {
      const response = await fetch('/api/payout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: withdrawUsername, 
          amount: amountNum,
          payoutMethod: 'gamepass',
          gamepassId: gamepassId.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setWithdrawStatus({ type: 'error', message: data.error || t.withdrawErrorMsg });
        return;
      }

      const newBal = balance - amountNum;
      setBalance(newBal);
      setWithdrawStatus({ 
        type: 'success', 
        message: t.withdrawSuccessMsg 
      });

      // Sync active user balance in localstorage
      const activeUser = localStorage.getItem('active_user');
      if (activeUser) {
        const updatedUser = { ...JSON.parse(activeUser), balance: newBal };
        localStorage.setItem('active_user', JSON.stringify(updatedUser));
      }

      // Fetch latest live payouts to immediately reflect the new payout request in the feed
      fetchLivePayouts();

    } catch (err) {
      setWithdrawStatus({ type: 'error', message: t.connectionError });
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return lang === 'tr' ? 'Az önce' : 'Just now';
      if (diffMins < 60) return lang === 'tr' ? `${diffMins} dakika önce` : `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return lang === 'tr' ? `${diffHours} saat önce` : `${diffHours}h ago`;
      return lang === 'tr' ? '1 gün önce' : '1 day ago';
    } catch (e) {
      return lang === 'tr' ? 'Az önce' : 'Just now';
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#0a0712] text-slate-100 py-4 sm:py-6 px-2 sm:px-6 lg:px-8 relative flex flex-col">
      
      {/* Upper header profile menu - Solid clean box to avoid background artifacts */}
      <header className="w-full max-w-7xl mx-auto bg-[#130d22] border border-purple-500/15 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-6 lg:mb-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          
          {/* Top Row: Brand Logo & Mobile Logout */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg border border-purple-500/20">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
                BloxGain
              </span>
            </div>

            {/* Logout button (Visible only on mobile in top-bar) */}
            <button 
              id="btn-logout-mobile"
              onClick={onLogout}
              className="lg:hidden p-1.5 bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-red-300 hover:text-red-200 rounded-xl transition duration-300"
              title={t.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Bar & Action Row: Flex wrap with proper spacing */}
          <div className="flex flex-wrap items-center justify-between sm:justify-start lg:justify-end gap-1.5 sm:gap-3 w-full lg:w-auto">
            
            {/* 28 Languages Selector dropdown */}
            <div className="relative">
              <button
                id="language-select-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 bg-purple-950/45 hover:bg-purple-900/60 px-2.5 py-1.5 rounded-xl border border-purple-500/20 text-[10px] sm:text-xs font-bold transition duration-200 cursor-pointer text-slate-200"
              >
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                <span>{LANGUAGES.find(l => l.code === lang)?.flag || '🇹🇷'}</span>
                <span className="uppercase text-white text-[9px] sm:text-[11px] font-black">{lang}</span>
              </button>
              {langMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                  <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-48 max-h-64 overflow-y-auto bg-[#140e24] border border-purple-500/30 rounded-xl z-50 py-1 divide-y divide-purple-500/10 custom-scrollbar">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          localStorage.setItem('app_lang', l.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-purple-600/20 transition duration-150 ${l.code === lang ? 'text-emerald-400 font-bold bg-purple-600/10' : 'text-slate-300'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{l.flag}</span>
                          <span>{l.name}</span>
                        </span>
                        {l.code === lang && <span className="text-emerald-400 font-black">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User badge */}
            <div className="flex items-center gap-1.5 bg-purple-950/40 px-2.5 py-1 rounded-xl border border-purple-500/10 text-[10px] sm:text-sm">
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt="Roblox Avatar" 
                  className="w-5 h-5 rounded-full border border-purple-500/30 bg-purple-900/30 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span className="text-white font-medium max-w-[80px] sm:max-w-none truncate">{user.username}</span>
              <span className="text-[8px] sm:text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{t.active}</span>
            </div>

            {/* Real-time coin balance */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/25 to-indigo-600/25 px-2.5 sm:px-4 py-1.5 rounded-xl border border-purple-500/30 text-[10px] sm:text-sm">
              <Coins className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-yellow-400" />
              <span className="text-white font-black">{balance} Coin</span>
              <span className="text-slate-400 text-[9px] sm:text-xs font-medium border-l border-purple-500/30 pl-1.5">
                ≈ {(balance / 100).toFixed(1)} Robux
              </span>
            </div>

            {/* Logout button (Visible only on desktop inside this row) */}
            <button 
              id="btn-logout-desktop"
              onClick={onLogout}
              className="hidden lg:block p-1.5 sm:p-2 bg-red-950/30 hover:bg-red-950/60 border border-red-500/20 text-red-300 hover:text-red-200 rounded-xl transition duration-300"
              title={t.logout}
            >
              <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

          </div>
        </div>
      </header>

      {/* Main Panel Content container */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden">
        
        {/* Left column navigation panel */}
        <div className="lg:col-span-3 flex flex-col gap-3 w-full max-w-full overflow-hidden">
          
          {/* Tabs row: horizontal-scroll carousel on mobile, vertical list on desktop */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 w-full max-w-full no-scrollbar">
            
            <button
              id="tab-btn-earn"
              onClick={() => setActiveTab('earn')}
              className={`flex-shrink-0 min-w-[125px] sm:min-w-[145px] lg:min-w-0 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4 rounded-xl font-semibold transition-all duration-300 border gap-1.5 lg:gap-3 ${
                activeTab === 'earn'
                  ? 'bg-purple-600/25 border-purple-500 text-white'
                  : 'bg-[#120d22] border-purple-500/10 text-gray-400 hover:bg-purple-950/20 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-center gap-1 sm:gap-1.5 lg:gap-3 text-center lg:text-left">
                <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-bold tracking-tight line-clamp-1">{t.earnTitle}</span>
              </div>
              <span className="text-[8px] sm:text-[9px] lg:text-xs bg-emerald-500/20 text-emerald-300 px-1 sm:px-1.5 py-0.5 rounded-full font-extrabold flex-shrink-0">1.5x</span>
            </button>

            <button
              id="tab-btn-wheel"
              onClick={() => setActiveTab('wheel')}
              className={`flex-shrink-0 min-w-[125px] sm:min-w-[145px] lg:min-w-0 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4 rounded-xl font-semibold transition-all duration-300 border gap-1.5 lg:gap-3 ${
                activeTab === 'wheel'
                  ? 'bg-purple-600/25 border-purple-500 text-white'
                  : 'bg-[#120d22] border-purple-500/10 text-gray-400 hover:bg-purple-950/20 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-center gap-1 sm:gap-1.5 lg:gap-3 text-center lg:text-left">
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-bold tracking-tight line-clamp-1">{t.wheelTitle}</span>
              </div>
              <span className="text-[8px] sm:text-[9px] lg:text-xs bg-purple-500/25 text-purple-300 px-1 sm:px-1.5 py-0.5 rounded-full font-extrabold uppercase flex-shrink-0">FREE</span>
            </button>

            <button
              id="tab-btn-withdraw"
              onClick={() => setActiveTab('withdraw')}
              className={`flex-shrink-0 min-w-[125px] sm:min-w-[145px] lg:min-w-0 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4 rounded-xl font-semibold transition-all duration-300 border gap-1.5 lg:gap-3 ${
                activeTab === 'withdraw'
                  ? 'bg-purple-600/25 border-purple-500 text-white'
                  : 'bg-[#120d22] border-purple-500/10 text-gray-400 hover:bg-purple-950/20 hover:text-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-center gap-1 sm:gap-1.5 lg:gap-3 text-center lg:text-left">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="text-[10px] sm:text-xs lg:text-sm font-bold tracking-tight line-clamp-1">{t.withdrawTitle}</span>
              </div>
              <span className="text-[8px] sm:text-[9px] lg:text-xs bg-yellow-500/25 text-yellow-300 px-1 sm:px-1.5 py-0.5 rounded-full font-extrabold flex-shrink-0">0%</span>
            </button>

          </div>

          {/* Quick Stats sidebar widget - Solid beautiful dark color */}
          <div className="hidden lg:block bg-[#120d22] border border-purple-500/10 rounded-2xl p-5 mt-4 space-y-4">
            <h4 className="font-bold text-xs uppercase text-purple-300 tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              {t.liveFeedTitle}
            </h4>
            
            <div className="space-y-3 divide-y divide-purple-500/10 text-xs">
              {livePayouts.map((payout, idx) => (
                <div key={idx} className="pt-2">
                  <span className="text-emerald-400 font-bold">@{payout.username}</span> {payout.robuxAmount} Robux.
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {formatTime(payout.createdAt)} • {lang === 'tr' ? 'Onaylandı' : 'Approved'}
                  </p>
                </div>
              ))}
              {livePayouts.length === 0 && (
                <div className="text-gray-500 py-2">
                  {lang === 'tr' ? 'Henüz ödeme yok.' : 'No payouts yet.'}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column active panel display */}
        <div className="lg:col-span-9">
          
          <AnimatePresence mode="wait">
            
            {/* 1. EARN TAB */}
            {activeTab === 'earn' && (
              <motion.div
                key="earn-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Promo Header Banner - Highly professional solid styling */}
                <div className="p-6 rounded-2xl bg-[#130e26] border border-purple-500/30 relative overflow-hidden">
                  <div className="max-w-lg space-y-2 z-10 relative">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                      ayeT-Studios ENTEGRASYONU
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {t.promoHeader}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {t.promoSub}
                    </p>
                  </div>
                  <div className="absolute right-6 bottom-4 text-7xl select-none opacity-20 pointer-events-none">🎮</div>
                </div>

                {/* Task Toast Message */}
                {taskToast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {taskToast}
                  </motion.div>
                )}

                {/* Offerwalls Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      {t.featuredTasks}
                    </h3>
                    <span className="text-xs text-gray-400">4 {t.totalTasks}</span>
                  </div>

                  {/* Clean solid boxes for tasks - avoids WebView distortion entirely */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offersList.map((off) => (
                      <div 
                        key={off.id}
                        className="bg-[#120d22] border border-purple-500/10 hover:border-purple-500/30 p-5 rounded-2xl flex justify-between items-center transition duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl bg-purple-950/60 p-3 rounded-xl border border-purple-500/10 group-hover:scale-105 transition duration-300">
                            {off.icon}
                          </span>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">{off.category} • {off.difficulty}</span>
                            <h4 className="font-bold text-white text-base mt-0.5 group-hover:text-purple-300 transition duration-300">{off.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Coins: +{off.payout}</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-black px-3 py-1 rounded-xl text-sm flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-emerald-400" />
                            +{off.payout}
                          </span>
                          <button 
                            id={`btn-offer-${off.id}`}
                            onClick={() => {
                              setTaskToast(lang === 'tr' 
                                ? `'${off.name}' görevi başarıyla başlatıldı! Görev tamamlandığında ödülünüz otomatik olarak bakiye kısmına eklenecektir.` 
                                : `'${off.name}' task successfully started! Your reward will be automatically added to your balance upon completion.`
                              );
                              setBalance(prev => {
                                const newBal = prev + off.payout;
                                const activeUser = localStorage.getItem('active_user');
                                if (activeUser) {
                                  const updatedUser = { ...JSON.parse(activeUser), balance: newBal };
                                  localStorage.setItem('active_user', JSON.stringify(updatedUser));
                                }
                                return newBal;
                              });
                              setTimeout(() => setTaskToast(null), 5000);
                            }}
                            className="text-xs text-purple-400 hover:text-emerald-300 font-bold flex items-center gap-1 group/btn"
                          >
                            <span>{t.doingTask}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition group-hover/btn:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
 
            {/* 2. LUCKY WHEEL TAB */}
            {activeTab === 'wheel' && (
              <motion.div
                key="wheel-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col items-center"
              >
                <div className="w-full text-center max-w-lg mx-auto space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {t.dailyWheelTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {t.dailyWheelSub}
                  </p>
                </div>

                {/* Interactive CSS Wheel representation */}
                <div className="relative my-8 flex flex-col items-center">
                  
                  {/* Pin Indicator */}
                  <div className="absolute top-0 z-20 -mt-5">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-emerald-400" />
                  </div>

                  {/* Spinning wheel container */}
                  <motion.div
                    id="canvas-lucky-wheel"
                    animate={
                      spinning 
                        ? { rotate: [0, 3600] } 
                        : spinResult !== null 
                        ? { rotate: 360 * 5 + (spinResult * 45) } 
                        : { rotate: 0 }
                    }
                    transition={spinning ? { duration: 3, ease: 'easeInOut' } : { duration: 0.1 }}
                    className="w-64 h-64 sm:w-80 sm:h-80 rounded-full border-[8px] border-purple-950 bg-[#16102a] relative flex items-center justify-center overflow-hidden"
                  >
                    {/* Wheel Sectors split by CSS clip path */}
                    <div className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center font-bold text-sm text-white">
                      {prizes.map((p, index) => {
                        const rot = index * 45;
                        return (
                          <div 
                            key={index} 
                            style={{ transform: `rotate(${rot}deg)` }} 
                            className="absolute inset-0 flex items-start justify-center pt-8 font-extrabold text-sm sm:text-base text-purple-200"
                          >
                            <span style={{ transform: 'rotate(90deg)' }} className="bg-purple-950/40 px-2 py-1 rounded border border-purple-500/15">
                              {p} 🪙
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Outer visual division lines */}
                    <div className="absolute inset-0 w-full h-full border-t border-purple-500/20 rotate-45 pointer-events-none" />
                    <div className="absolute inset-0 w-full h-full border-t border-purple-500/20 rotate-90 pointer-events-none" />
                    <div className="absolute inset-0 w-full h-full border-t border-purple-500/20 rotate-135 pointer-events-none" />
                    <div className="absolute inset-0 w-full h-full border-t border-purple-500/20 pointer-events-none" />

                    {/* Central button core */}
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-950 border-4 border-emerald-400 flex items-center justify-center z-10">
                      <Gift className="w-6 h-6 text-emerald-300 animate-bounce" />
                    </div>
                  </motion.div>

                  {/* Absolute bypass spinner feedback */}
                  {spinning && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center z-30">
                      <RotateCw className="w-10 h-10 text-emerald-400 animate-spin" />
                      <span className="text-xs font-bold text-white mt-2 tracking-wide">{t.spinningText}</span>
                    </div>
                  )}

                </div>

                {/* Wheel Spin Actions */}
                <div className="flex flex-col items-center space-y-3 w-full max-w-sm">
                  <button
                    id="btn-spin-wheel"
                    onClick={handleSpin}
                    disabled={spinning}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-purple-950 font-black text-lg py-4 px-8 rounded-2xl border border-emerald-400 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-center"
                  >
                    {spinning ? t.spinningText : hasSpunToday ? t.active : t.spinButton}
                  </button>

                  {wheelToast && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-center text-xs text-purple-300"
                    >
                      {wheelToast}
                    </motion.div>
                  )}

                  {/* Security Explainer for lucky wheel */}
                  <div className="p-3.5 bg-[#120d22] border border-purple-500/10 rounded-xl text-[10px] text-gray-500 text-center flex items-start gap-2">
                    <Lock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <p className="text-left leading-normal">
                      <strong>Hile Önleme:</strong> Çark ödülleri ve günlük sınır KESİNLİKLE frontend'de hesaplanmaz. Çevirme düğmesine basıldığında backend güvenli bir bakiye sorgusu yapar ve sonucu döndürür.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. WITHDRAW TAB */}
            {activeTab === 'withdraw' && (
              <motion.div
                key="withdraw-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-[#130e26] border border-purple-500/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      ROBLOX PAYOUT
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      {t.withdrawTitle}
                    </h2>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                      {t.withdrawSub}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Form column */}
                  <div className="md:col-span-7 bg-[#120d22] border border-purple-500/10 p-6 rounded-2xl space-y-5">
                    
                    <div className="border-b border-purple-500/10 pb-4">
                      <h3 className="font-bold text-lg text-white">{t.withdrawFormTitle}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t.withdrawFormSub}</p>
                    </div>

                    <form onSubmit={handleWithdraw} className="space-y-4">
                      
                      {/* Roblox Username */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">{t.robloxUserLabel}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <input
                            id="input-withdraw-username"
                            type="text"
                            value={withdrawUsername}
                            onChange={(e) => setWithdrawUsername(e.target.value)}
                            placeholder={t.robloxUserPlaceholder}
                            className="w-full bg-purple-950/40 border border-purple-500/20 text-sm text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/60 transition duration-300"
                          />
                        </div>
                      </div>

                      {/* Coin Amount */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">{t.coinAmountLabel}</label>
                          <button
                            id="btn-withdraw-all"
                            type="button"
                            onClick={() => setWithdrawAmount(Math.max(1000, Math.floor(balance / 100) * 100).toString())}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            {t.withdrawAll}
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                            <Coins className="w-5 h-5" />
                          </div>
                          <input
                            id="input-withdraw-amount"
                            type="number"
                            min="1000"
                            step="100"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder={t.coinAmountPlaceholder}
                            className="w-full bg-purple-950/40 border border-purple-500/20 text-sm text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-purple-500/60 transition duration-300"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {t.coinRateInfo}
                        </p>
                      </div>

                      {/* 30% Roblox Creator Tax Compensation Calculator Panel */}
                      {(() => {
                        const desiredRobux = isNaN(parseInt(withdrawAmount)) ? 0 : Math.floor(parseInt(withdrawAmount) / 100);
                        const finalPrice = Math.ceil(desiredRobux / 0.7);
                        const robloxFee = finalPrice - desiredRobux;

                        return (
                          <div className="bg-[#181135] border border-purple-500/20 p-4 rounded-xl space-y-2.5">
                            <h4 className="text-xs font-black text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-4.5 h-4.5 text-yellow-400" />
                              {lang === 'tr' ? 'Roblox %30 Kesinti Hesaplayıcı' : 'Roblox 30% Tax Calculator'}
                            </h4>
                            <div className="grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs text-white">
                              <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-500/10">
                                <span className="block text-gray-400 text-[9px] uppercase font-bold">{lang === 'tr' ? 'Net Robux' : 'Net Robux'}</span>
                                <span className="text-emerald-400 font-black text-sm">{desiredRobux} R$</span>
                              </div>
                              <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-500/10">
                                <span className="block text-gray-400 text-[9px] uppercase font-bold">{lang === 'tr' ? 'Roblox Payı' : 'Roblox Tax'}</span>
                                <span className="text-purple-400 font-bold">+{robloxFee} R$</span>
                              </div>
                              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <span className="block text-emerald-400 text-[9px] uppercase font-bold">{lang === 'tr' ? 'Gamepass Fiyatı' : 'Gamepass Price'}</span>
                                <span className="text-yellow-400 font-black text-sm">{finalPrice} R$</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                              {lang === 'tr' 
                                ? `* Roblox'un %30 vergisini karşılamak için oluşturduğunuz Gamepass fiyatını tam olarak ${finalPrice} Robux yapmalısınız. Böylece hesabınıza net ${desiredRobux} Robux geçer.` 
                                : `* To offset the 30% Roblox cut, you must price your Gamepass at exactly ${finalPrice} Robux. This ensures you receive exactly ${desiredRobux} Robux.`}
                            </p>
                          </div>
                        );
                      })()}

                      {/* Roblox Game and Gamepass Selection UI */}
                      <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-500/10 space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-white tracking-wider uppercase block">
                            {lang === 'tr' ? 'ROBLOX OYUNU VE GAMEPASS SEÇİMİ' : 'ROBLOX GAME & GAMEPASS'}
                          </label>
                          <button
                            type="button"
                            onClick={() => setManualMode(!manualMode)}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold transition underline"
                          >
                            {manualMode 
                              ? (lang === 'tr' ? 'Otomatik Seçime Dön' : 'Switch to Auto Select') 
                              : (lang === 'tr' ? 'Manuel Gamepass ID Gir' : 'Enter Gamepass ID Manually')}
                          </button>
                        </div>

                        {fetchingGames ? (
                          <div className="py-4 flex flex-col items-center justify-center gap-2">
                            <RotateCw className="w-6 h-6 text-emerald-400 animate-spin" />
                            <span className="text-xs text-gray-400">{lang === 'tr' ? 'Oyunlarınız yükleniyor...' : 'Loading games...'}</span>
                          </div>
                        ) : manualMode ? (
                          <div className="space-y-2">
                            <label className="text-[11px] text-gray-400 font-bold block">{lang === 'tr' ? 'Gamepass ID veya Linki' : 'Gamepass ID or Link'}</label>
                            <input
                              type="text"
                              value={gamepassId}
                              onChange={(e) => setGamepassId(e.target.value)}
                              placeholder={lang === 'tr' ? 'Örn: 987654321' : 'e.g., 987654321'}
                              className="w-full bg-purple-950/40 border border-purple-500/25 text-xs text-white px-3 py-2 rounded-lg focus:outline-none"
                            />
                            <p className="text-[9px] text-gray-500">
                              {lang === 'tr' 
                                ? 'Oluşturduğunuz ve satışa sunduğunuz Gamepass ID değerini buraya girin.' 
                                : 'Enter your customized and for-sale gamepass ID here.'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Game Select */}
                            <div className="space-y-1">
                              <span className="text-[11px] text-purple-300 font-bold block">{lang === 'tr' ? 'Aktif Oyununuz' : 'Your Experience'}</span>
                              <select
                                value={selectedGameId}
                                onChange={(e) => {
                                  const gameId = e.target.value;
                                  setSelectedGameId(gameId);
                                  // Update gamepass select accordingly
                                  const matchingPasses = robloxGamepasses.filter(p => p.universeId === gameId);
                                  if (matchingPasses.length > 0) {
                                    setGamepassId(matchingPasses[0].id);
                                  } else {
                                    setGamepassId('');
                                  }
                                }}
                                className="w-full bg-[#161132] border border-purple-500/20 text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-purple-500/60"
                              >
                                {robloxGames.length === 0 ? (
                                  <option value="">{lang === 'tr' ? 'Önce kullanıcı adı girin' : 'Enter username first'}</option>
                                ) : (
                                  robloxGames.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                  ))
                                )}
                              </select>
                            </div>

                            {/* Gamepass Select */}
                            <div className="space-y-1">
                              <span className="text-[11px] text-purple-300 font-bold block">{lang === 'tr' ? 'Çekilecek Gamepass' : 'Gamepass to Sell'}</span>
                              <select
                                value={gamepassId}
                                onChange={(e) => setGamepassId(e.target.value)}
                                className="w-full bg-[#161132] border border-purple-500/20 text-xs text-white p-2.5 rounded-lg focus:outline-none focus:border-purple-500/60"
                              >
                                {robloxGamepasses.filter(p => p.universeId === selectedGameId).length === 0 ? (
                                  <option value="">{lang === 'tr' ? 'Bu oyunda aktif gamepass bulunamadı!' : 'No gamepasses found for this experience!'}</option>
                                ) : (
                                  robloxGamepasses.filter(p => p.universeId === selectedGameId).map(p => {
                                    const expectedRobux = isNaN(parseInt(withdrawAmount)) ? 0 : Math.floor(parseInt(withdrawAmount) / 100);
                                    const requiredPrice = Math.ceil(expectedRobux / 0.7);
                                    return (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.price > 0 ? `${p.price} Robux` : (lang === 'tr' ? 'Ücretsiz veya Ayarsız' : 'No Price set')})
                                      </option>
                                    );
                                  })
                                )}
                              </select>
                              <p className="text-[10px] text-gray-500 leading-normal mt-1">
                                {lang === 'tr' 
                                  ? 'Listede gamepass görünmüyorsa lütfen Roblox sayfanızdan oluşturun veya "Manuel Gamepass ID Gir" seçeneğini kullanın.' 
                                  : 'If no gamepasses are visible, please create one in Roblox Creator Dashboard or choose Manual Entry.'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Roblox Avatar Preview Card */}
                      {(robloxAvatar || fetchingAvatar) && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-4 bg-purple-950/40 p-3.5 rounded-2xl border border-purple-500/20"
                        >
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-purple-900/50 border border-purple-500/35 flex items-center justify-center flex-shrink-0">
                            {fetchingAvatar ? (
                              <RotateCw className="w-6 h-6 text-purple-400 animate-spin" />
                            ) : robloxAvatar ? (
                              <img 
                                src={robloxAvatar} 
                                alt={`${withdrawUsername} Avatar`} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-6 h-6 text-purple-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-white">
                              {fetchingAvatar ? t.searchingUser : `@${withdrawUsername}`}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {fetchingAvatar ? t.searchingWait : t.userNote}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Submit Withdraw Button */}
                      <button
                        id="btn-withdraw-submit"
                        type="submit"
                        disabled={withdrawStatus.type === 'loading'}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold tracking-wide py-3 rounded-xl border border-purple-500/20 cursor-pointer disabled:opacity-50 transition duration-300 flex justify-center items-center gap-2"
                      >
                        {withdrawStatus.type === 'loading' ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span>{t.withdrawButton}</span>
                            <Coins className="w-4.5 h-4.5 text-yellow-400" />
                          </>
                        )}
                      </button>

                    </form>

                    {/* Status Feedback block */}
                    {withdrawStatus.type !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border text-xs leading-relaxed ${
                          withdrawStatus.type === 'success'
                            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-200'
                            : withdrawStatus.type === 'error'
                            ? 'bg-red-950/50 border-red-500/30 text-red-200'
                            : 'bg-purple-950/40 border-purple-500/20 text-purple-200'
                        }`}
                      >
                        {withdrawStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 inline mr-2 align-middle" />}
                        {withdrawStatus.type === 'error' && <ShieldAlert className="w-4 h-4 text-red-400 inline mr-2 align-middle" />}
                        {withdrawStatus.type === 'loading' && <RotateCw className="w-4 h-4 text-purple-400 inline mr-2 align-middle animate-spin" />}
                        <span className="align-middle">{withdrawStatus.message}</span>
                      </motion.div>
                    )}

                  </div>

                  {/* Right Instruction Payout guide column */}
                  <div className="md:col-span-5 bg-[#120d22] border border-purple-500/10 p-5 rounded-2xl space-y-4 text-xs text-gray-400 leading-relaxed">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-purple-500/10 pb-2">
                      {t.howItWorks}
                    </h4>

                    <div className="space-y-3">
                      <div className="flex gap-2.5">
                        <span className="bg-purple-950/80 border border-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                        <p>{t.step1}</p>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="bg-purple-950/80 border border-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                        <p>{t.step2}</p>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="bg-purple-950/80 border border-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                        <p>{t.step3}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-500/10 mt-2">
                      <p className="font-semibold text-purple-300">{t.whyPayoutTitle}</p>
                      <p className="text-[11px] mt-1 text-gray-500">
                        {t.whyPayoutText}
                      </p>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mobile Live Feed - Shown only on mobile, placed at the very bottom of the main container */}
        <div className="lg:hidden col-span-1 bg-[#120d22] border border-purple-500/10 rounded-2xl p-5 mt-4 space-y-4">
          <h4 className="font-bold text-xs uppercase text-purple-300 tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
            {t.liveFeedTitle}
          </h4>
          
          <div className="space-y-3 divide-y divide-purple-500/10 text-xs">
            {livePayouts.map((payout, idx) => (
              <div key={idx} className="pt-2">
                <span className="text-emerald-400 font-bold">@{payout.username}</span> {payout.robuxAmount} Robux.
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {formatTime(payout.createdAt)} • {lang === 'tr' ? 'Onaylandı' : 'Approved'}
                </p>
              </div>
            ))}
            {livePayouts.length === 0 && (
              <div className="text-gray-500 py-2">
                {lang === 'tr' ? 'Henüz ödeme yok.' : 'No payouts yet.'}
              </div>
            )}
          </div>
        </div>

      </main>

    </div>
  );
}
