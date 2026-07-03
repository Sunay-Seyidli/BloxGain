/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Coins, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  Gamepad2,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { AuthMode, NotificationState } from './types';

interface AuthPageProps {
  onSuccess: (userData: { username: string; email: string; balance: number }) => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom interactive state for input validations
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Trigger quick temporary notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Basic validation rules
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (mode === 'register') {
      if (!username.trim()) {
        newErrors.username = 'Kullanıcı adı gereklidir.';
      } else if (username.length < 3) {
        newErrors.username = 'Kullanıcı adı en az 3 karakter olmalıdır.';
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        newErrors.username = 'Sadece harf, rakam ve alt çizgi kullanılabilir.';
      }

      if (!email.trim()) {
        newErrors.email = 'E-posta adresi gereklidir.';
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = 'Geçerli bir e-posta adresi giriniz.';
      }

      if (!password) {
        newErrors.password = 'Şifre gereklidir.';
      } else if (password.length < 6) {
        newErrors.password = 'Şifre en az 6 karakter olmalıdır.';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Şifreler eşleşmiyor.';
      }
    } else {
      // Login validation
      if (!username.trim()) {
        newErrors.username = 'Kullanıcı adı veya e-posta gereklidir.';
      }
      if (!password) {
        newErrors.password = 'Şifre gereklidir.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Lütfen formdaki hataları düzeltin.', 'error');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.error || 'Kayıt sırasında bir hata oluştu.', 'error');
          return;
        }

        localStorage.setItem('active_user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);
        
        showToast('Kayıt başarılı! 150 Hoş geldin Coini hesabınıza tanımlandı.', 'success');
        setTimeout(() => {
          onSuccess(data.user);
        }, 1000);
      } else {
        // Login flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
          showToast(data.error || 'Giriş bilgileri hatalı.', 'error');
          return;
        }

        localStorage.setItem('active_user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.token);

        showToast('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
        setTimeout(() => {
          onSuccess(data.user);
        }, 1000);
      }
    } catch (err) {
      showToast('Bağlantı hatası! Sunucuya erişilemiyor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      icon: <Coins className="w-5 h-5 text-emerald-400" />,
      title: 'Yüksek Dönüşüm Oranı',
      desc: '100 Coin = 1 Robux. Görevleri hızlıca tamamla, bakiyeni doldur.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      title: 'Günlük Ücretsiz Çarkıfelek',
      desc: 'Her gün giriş yap ve ücretsiz çevirerek sürpriz Coinler kazan.',
    },
    {
      icon: <Gamepad2 className="w-5 h-5 text-cyan-400" />,
      title: '0 Kesintiyle Grup Ödemesi',
      desc: 'Roblox grubumuz üzerinden anında ve güvenli payout transferi.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-gamer flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      
      {/* Absolute Decorative Glow Stars */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            id="auth-toast"
            className={`fixed top-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md max-w-md ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-red-990/90 border-red-500/40 text-red-200'
                : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Pitch and Benefits */}
        <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-center text-center lg:text-left space-y-6">
          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl border border-purple-500/30">
              <TrendingUp className="w-7 h-7 text-emerald-300" />
            </div>
            <span className="text-3xl font-black tracking-wider bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              BloxGain
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-none text-white">
            Görev Yap, <br />
            <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Robux Kazan!
            </span>
          </h1>

          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
            BloxGain ile en sevdiğin oyunları oynayarak, anketleri çözerek ve çarkıfeleği çevirerek ücretsiz Robux kazanabilirsin. Hızlı, güvenilir ve tamamen ücretsiz!
          </p>

          {/* Benefits Grid */}
          <div className="space-y-4 pt-2">
            {benefits.map((b, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="flex items-start gap-4 p-3.5 bg-purple-950/25 hover:bg-purple-950/40 border border-purple-500/10 rounded-xl transition duration-300 group"
              >
                <div className="p-2 bg-purple-950/50 rounded-lg group-hover:scale-110 transition duration-300">
                  {b.icon}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-white text-sm sm:text-base">{b.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side: Glassmorphic Interactive Login / Register Form */}
        <div className="order-1 lg:order-2 lg:col-span-7 flex justify-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            id="auth-card"
            className="w-full max-w-md bg-[#130d22]/85 border border-purple-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Corner ambient lights inside card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Mode Switch Tabs */}
            <div className="flex bg-purple-950/60 p-1.5 rounded-xl border border-purple-500/15 mb-6">
              <button
                id="btn-tab-login"
                type="button"
                onClick={() => { setMode('login'); setErrors({}); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative ${
                  mode === 'login' 
                    ? 'text-white bg-purple-600/30 border border-purple-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Giriş Yap
                {mode === 'login' && (
                  <motion.div 
                    layoutId="activeTabGlow" 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-full"
                  />
                )}
              </button>
              <button
                id="btn-tab-register"
                type="button"
                onClick={() => { setMode('register'); setErrors({}); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative ${
                  mode === 'register' 
                    ? 'text-white bg-purple-600/30 border border-purple-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Kayıt Ol
                {mode === 'register' && (
                  <motion.div 
                    layoutId="activeTabGlow" 
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-full"
                  />
                )}
              </button>
            </div>

            {/* Form Title & Description */}
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                {mode === 'login' ? 'Tekrar Hoş Geldiniz!' : 'Yeni Bir Hesap Oluşturun'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {mode === 'login' 
                  ? 'Robux kazanmaya devam etmek için bilgilerinizi girin.' 
                  : 'Sadece 30 saniyede üye olun, bonus Coin kazanın.'
                }
              </p>
            </div>

            {/* Form Input Elements */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">
                  {mode === 'register' ? 'Roblox Kullanıcı Adı' : 'Kullanıcı Adı'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={mode === 'register' ? 'Roblox kullanıcı adınız' : 'Kullanıcı adınız'}
                    className={`w-full bg-purple-950/40 border text-sm text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors.username 
                        ? 'border-red-500/50 bg-red-950/10 focus:ring-1 focus:ring-red-500/50' 
                        : 'border-purple-500/20 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30'
                    }`}
                  />
                </div>
                {errors.username && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-xs text-red-400 flex items-center gap-1 mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.username}
                  </motion.p>
                )}
                {mode === 'register' && !errors.username && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    * Robux çekimleri için Roblox hesabınızla birebir aynı olmalıdır. Şifrenizi istemiyoruz.
                  </p>
                )}
              </div>

              {/* Email Input (Only for Register) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ornek@gmail.com"
                      className={`w-full bg-purple-950/40 border text-sm text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.email 
                          ? 'border-red-500/50 bg-red-950/10 focus:ring-1 focus:ring-red-500/50' 
                          : 'border-purple-500/20 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-xs text-red-400 flex items-center gap-1 mt-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">
                    Şifre
                  </label>
                  {mode === 'login' && (
                    <a 
                      href="#forgot" 
                      onClick={(e) => { e.preventDefault(); showToast('Şifre sıfırlama sistemi yakında aktif olacak!', 'info'); }}
                      className="text-xs text-purple-400 hover:text-purple-300 transition duration-300"
                    >
                      Şifremi Unuttum?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-purple-950/40 border text-sm text-white pl-10 pr-10 py-3 rounded-xl focus:outline-none transition-all duration-300 ${
                      errors.password 
                        ? 'border-red-500/50 bg-red-950/10 focus:ring-1 focus:ring-red-500/50' 
                        : 'border-purple-500/20 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30'
                    }`}
                  />
                  <button
                    id="btn-toggle-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-purple-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-xs text-red-400 flex items-center gap-1 mt-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Confirm Password (Only for Register) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-300 tracking-wider uppercase block">
                    Şifre Tekrarı
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="input-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-purple-950/40 border text-sm text-white pl-10 pr-10 py-3 rounded-xl focus:outline-none transition-all duration-300 ${
                        errors.confirmPassword 
                          ? 'border-red-500/50 bg-red-950/10 focus:ring-1 focus:ring-red-500/50' 
                          : 'border-purple-500/20 focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30'
                      }`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-xs text-red-400 flex items-center gap-1 mt-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                id="btn-auth-submit"
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold tracking-wide py-3.5 rounded-xl border border-purple-500/30 active:scale-[0.98] transition-all duration-300 flex justify-center items-center gap-2 cursor-pointer relative overflow-hidden"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Kazan'}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-300" />
                  </>
                )}
                {/* Shiny animated overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
              </button>

            </form>

            {/* Terms Disclaimer */}
            {mode === 'register' && (
              <p className="text-[10px] text-gray-500 text-center mt-4 leading-relaxed">
                Kayıt olarak BloxGain Kullanım Koşulları ve Gizlilik Politikası kurallarını kabul etmiş olursunuz.
              </p>
            )}

            {/* Admin Bypass Demo Button */}
            <div className="mt-6 pt-5 border-t border-purple-500/10 text-center">
              <button
                id="btn-demo-bypass"
                type="button"
                onClick={() => {
                  const demoUser = {
                    username: 'RobloxGamer_99',
                    email: 'gamer99@gmail.com',
                    balance: 450,
                  };
                  localStorage.setItem('active_user', JSON.stringify(demoUser));
                  showToast('Demo Kullanıcıyla Başarıyla Giriş Yapıldı!', 'success');
                  setTimeout(() => {
                    onSuccess(demoUser);
                  }, 1200);
                }}
                className="text-xs text-gray-500 hover:text-emerald-400 font-medium transition duration-300 flex items-center justify-center gap-1 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Hesapsız Hızlı Giriş Yap (Demo Modu)
              </button>
            </div>

          </motion.div>
        </div>

      </div>

      {/* Aesthetic footer credits */}
      <footer className="mt-16 text-xs text-gray-500 tracking-wide text-center">
        &copy; {new Date().getFullYear()} BloxGain. Tüm Hakları Saklıdır. Bu platform Roblox Corporation ile ilişkili değildir.
      </footer>
    </div>
  );
}
