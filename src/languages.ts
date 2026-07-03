/**
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranslationSet {
  active: string;
  balance: string;
  logout: string;
  earnTitle: string;
  wheelTitle: string;
  withdrawTitle: string;
  liveFeedTitle: string;
  promoHeader: string;
  promoSub: string;
  promoBadge: string;
  featuredTasks: string;
  totalTasks: string;
  doingTask: string;
  difficulty: string;
  difficultyHard: string;
  difficultyMedium: string;
  difficultyEasy: string;
  securityNoteTitle: string;
  securityNoteText: string;
  dailyWheelTitle: string;
  dailyWheelSub: string;
  spinButton: string;
  spinningText: string;
  spunSuccess: string;
  wheelLimitError: string;
  withdrawSub: string;
  grupBalance: string;
  withdrawFormTitle: string;
  withdrawFormSub: string;
  robloxUserLabel: string;
  robloxUserPlaceholder: string;
  searchingUser: string;
  searchingWait: string;
  userNote: string;
  coinAmountLabel: string;
  coinAmountPlaceholder: string;
  withdrawAll: string;
  coinRateInfo: string;
  willReceive: string;
  withdrawButton: string;
  howItWorks: string;
  step1: string;
  step2: string;
  step3: string;
  whyPayoutTitle: string;
  whyPayoutText: string;
  withdrawSuccessMsg: string;
  withdrawErrorMsg: string;
  connectionError: string;
  survey: string;
  social: string;
  game: string;
  comingSoon: string;
}

export const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' }
];

export const TRANSLATIONS: Record<string, TranslationSet> = {
  tr: {
    active: 'AKTİF',
    balance: 'Bakiye',
    logout: 'Çıkış',
    earnTitle: 'Teklif Duvarları (Kazan)',
    wheelTitle: 'Lucky Wheel (Çark)',
    withdrawTitle: 'Robux Çek (Payout)',
    liveFeedTitle: 'CANLI ÖDEME BESLEMESİ',
    promoHeader: 'Teklifleri Tamamla, Robux Yağmuruna Katıl!',
    promoSub: 'Sponsorlu oyunlarımızı indirip belirtilen görevleri tamamlayarak anında binlerce Coin biriktirebilirsin. Ödemeler anında Roblox hesabınıza aktarılır.',
    promoBadge: 'AYET-STUDIOS PROMOSYONU',
    featuredTasks: 'Öne Çıkan Görevler (ayeT-Studios Entegrasyonu)',
    totalTasks: 'teklif aktif',
    doingTask: 'Görevi Yap',
    difficulty: 'Zorluk',
    difficultyHard: 'Zor',
    difficultyMedium: 'Orta',
    difficultyEasy: 'Kolay',
    securityNoteTitle: 'Geliştirici Postback Notu (/api/v1/callback/ayet)',
    securityNoteText: 'ayeT-Studios callback endpoint\'i HMAC-SHA256 imzası ile korunacaktır. Hileli istekler, sunucu tarafındaki özel imza doğrulama algoritması sayesinde otomatik olarak reddedilir.',
    dailyWheelTitle: 'Günlük Şanslı Çarkıfelek',
    dailyWheelSub: 'Günde bir kez şansını ücretsiz olarak dene! Kazanılan tüm Coinler anında genel bakiyene yansıtılır.',
    spinButton: 'Çarkı Çevir (Günde 1 Ücretsiz)',
    spinningText: 'Ödül Hesaplanıyor...',
    spunSuccess: 'Tebrikler! Çarktan {prize} Coin kazandınız! Hesabınıza eklendi.',
    wheelLimitError: 'Çarkıfeleği günde sadece 1 kez çevirebilirsiniz!',
    withdrawSub: 'Kazandığın Coinleri dilediğin zaman anında Robux olarak hesabına aktar.',
    grupBalance: 'Grup Bakiyesi',
    withdrawFormTitle: 'Robux Çekim Formu',
    withdrawFormSub: 'Lütfen Roblox kullanıcı adınızı ve çekmek istediğiniz miktarı belirtin.',
    robloxUserLabel: 'Roblox Kullanıcı Adı',
    robloxUserPlaceholder: 'Roblox kullanıcı adınız',
    searchingUser: 'Roblox Hesabı Sorgulanıyor...',
    searchingWait: 'Lütfen bekleyin...',
    userNote: 'Bu hesaba anında %0 kesintiyle Payout gönderilecektir.',
    coinAmountLabel: 'Çekilecek Coin Miktarı',
    coinAmountPlaceholder: 'Minimum 100',
    withdrawAll: 'Hepsini Seç',
    coinRateInfo: '* 100 Coin = 1 Robux. Çekilen miktar 100\'ün katları olmalıdır.',
    willReceive: 'Alacağınız Robux Tutarı:',
    withdrawButton: 'Ödemeyi Çek',
    howItWorks: 'Çekim Nasıl Gerçekleşir?',
    step1: 'Roblox kullanıcı adınızı girin (Şifre gerekmez).',
    step2: 'Grubumuza katılmanız gerekmektedir. (Üyeliğiniz otomatik kontrol edilir).',
    step3: 'Sistem grubumuzdan belirttiğiniz miktar kadar Robux transferini anında hesabınıza yatırır.',
    whyPayoutTitle: 'Neden Payout?',
    whyPayoutText: 'Klasik gamepass satış yöntemindeki gibi 5 gün beklemek zorunda kalmazsınız. Ödemeler saniyeler içinde doğrudan geçer.',
    withdrawSuccessMsg: 'Tebrikler! Robux başarıyla hesabınıza aktarıldı!',
    withdrawErrorMsg: 'Ödeme işlemi başarısız oldu.',
    connectionError: 'Bağlantı hatası! Sunucuya erişilemedi.',
    survey: 'Anket',
    social: 'Sosyal',
    game: 'Oyun',
    comingSoon: 'Çok Yakında'
  },
  en: {
    active: 'ACTIVE',
    balance: 'Balance',
    logout: 'Logout',
    earnTitle: 'Offerwalls (Earn)',
    wheelTitle: 'Lucky Wheel',
    withdrawTitle: 'Robux Withdraw (Payout)',
    liveFeedTitle: 'LIVE PAYOUT FEED',
    promoHeader: 'Complete Offers, Earn Robux Rain!',
    promoSub: 'Download our sponsored games and complete simple tasks to instantly accumulate thousands of Coins. Payouts are instant to your Roblox account.',
    promoBadge: 'AYET-STUDIOS PROMOTION',
    featuredTasks: 'Featured Tasks (ayeT-Studios Integration)',
    totalTasks: 'offers active',
    doingTask: 'Do Task',
    difficulty: 'Difficulty',
    difficultyHard: 'Hard',
    difficultyMedium: 'Medium',
    difficultyEasy: 'Easy',
    securityNoteTitle: 'Developer Postback Notice (/api/v1/callback/ayet)',
    securityNoteText: 'The ayeT-Studios callback endpoint is secured with an HMAC-SHA256 signature. Unauthorized requests are automatically rejected by our verification system.',
    dailyWheelTitle: 'Daily Lucky Wheel',
    dailyWheelSub: 'Try your luck for free once a day! All won Coins are immediately credited to your balance.',
    spinButton: 'Spin Wheel (1 Free Daily)',
    spinningText: 'Calculating Prize...',
    spunSuccess: 'Congratulations! You won {prize} Coins! Added to your balance.',
    wheelLimitError: 'You can only spin the wheel once a day!',
    withdrawSub: 'Transfer your earned Coins instantly into Robux whenever you want.',
    grupBalance: 'Group Funds',
    withdrawFormTitle: 'Robux Withdraw Form',
    withdrawFormSub: 'Please enter your Roblox username and the amount you wish to withdraw.',
    robloxUserLabel: 'Roblox Username',
    robloxUserPlaceholder: 'Your Roblox username',
    searchingUser: 'Querying Roblox Account...',
    searchingWait: 'Please wait...',
    userNote: 'Instant Payout with 0% fee will be sent to this account.',
    coinAmountLabel: 'Coins Amount to Withdraw',
    coinAmountPlaceholder: 'Minimum 100',
    withdrawAll: 'Select All',
    coinRateInfo: '* 100 Coins = 1 Robux. Withdrawal amount must be a multiple of 100.',
    willReceive: 'Robux Amount You Will Receive:',
    withdrawButton: 'Withdraw Payout',
    howItWorks: 'How It Works?',
    step1: 'Enter your Roblox username (No password required).',
    step2: 'You must join our group (Membership is checked automatically).',
    step3: 'The system instantly transfers the selected Robux amount from our group funds to your account.',
    whyPayoutTitle: 'Why Payout?',
    whyPayoutText: 'No need to wait 5 days like classic gamepass sales. Payouts go directly into your account in seconds.',
    withdrawSuccessMsg: 'Congratulations! Robux successfully transferred to your account!',
    withdrawErrorMsg: 'Payout process failed.',
    connectionError: 'Connection error! Server unreachable.',
    survey: 'Survey',
    social: 'Social',
    game: 'Game',
    comingSoon: 'Coming Soon'
  }
};

// Generate fallback translation configurations for the other 26 languages automatically to prevent any compilation or crash issues, reusing English terms while maintaining local language dropdown representation.
const ISO_LANGS_REMAINING = [
  { code: 'az', name: 'Azərbaycan' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ru', name: 'Русский' },
  { code: 'ar', name: 'العربية' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'pl', name: 'Polski' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'ro', name: 'Română' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
  { code: 'uk', name: 'Українська' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'th', name: 'ภาษาไทย' }
];

// Seed other translation languages using standard Turkish/Azerbaijani or English mappings depending on similarity, ensuring full 28 language dictionary compatibility
ISO_LANGS_REMAINING.forEach(l => {
  if (l.code === 'az') {
    // Azerbaijani translations
    TRANSLATIONS[l.code] = {
      active: 'AKTİV',
      balance: 'Balans',
      logout: 'Çıxış',
      earnTitle: 'Təklif Divarları (Qazan)',
      wheelTitle: 'Şanslı Çarx',
      withdrawTitle: 'Robux Çək (Payout)',
      liveFeedTitle: 'CANLI ÖDƏNİŞ SİYAHISI',
      promoHeader: 'Təklifləri Tamamla, Robux Qazan!',
      promoSub: 'Sponsorlu oyunlarımızı yükləyərək və tapşırıqları tamamlayaraq dərhal minlərlə Coin qazana bilərsiniz. Ödənişlər dərhal Roblox hesabınıza göndərilir.',
      promoBadge: 'AYET-STUDIOS PROMOSİYASI',
      featuredTasks: 'Önə Çıxan Tapşırıqlar (ayeT-Studios İnteqrasiyası)',
      totalTasks: 'təklif aktivdir',
      doingTask: 'Tapşırığı Et',
      difficulty: 'Çətinlik',
      difficultyHard: 'Çətin',
      difficultyMedium: 'Orta',
      difficultyEasy: 'Asan',
      securityNoteTitle: 'Tərtibatçı Postback Qeydi (/api/v1/callback/ayet)',
      securityNoteText: 'ayeT-Studios callback endpoint-i HMAC-SHA256 imzası ilə qorunur. Saxta istəklər sistem tərəfindən rədd edilir.',
      dailyWheelTitle: 'Gündəlik Şans Çarxı',
      dailyWheelSub: 'Gündə bir dəfə şansınızı pulsuz sınayın! Qazanılan bütün Coin-lər dərhal balansınıza əlavə olunur.',
      spinButton: 'Çarxı Fırlat (Gündə 1 dəfə pulsuz)',
      spinningText: 'Mükafat Hesablanır...',
      spunSuccess: 'Təbriklər! Çarxdan {prize} Coin qazandınız! Balansınıza əlavə edildi.',
      wheelLimitError: 'Çarxı gündə yalnız 1 dəfə fırlada bilərsiniz!',
      withdrawSub: 'Qazandığınız Coinləri istədiyiniz vaxt dərhal Robux olaraq hesabınıza köçürün.',
      grupBalance: 'Qrup Balansı',
      withdrawFormTitle: 'Robux Çıxarış Formu',
      withdrawFormSub: 'Zəhmət olmasa Roblox istifadəçi adınızı və çıxarmaq istədiyiniz məbləği qeyd edin.',
      robloxUserLabel: 'Roblox İstifadəçi Adı',
      robloxUserPlaceholder: 'Roblox istifadəçi adınız',
      searchingUser: 'Roblox Hesabı Yoxlanılır...',
      searchingWait: 'Zəhmət olmasa gözləyin...',
      userNote: 'Bu hesaba dərhal %0 komissiya ilə Payout göndəriləcək.',
      coinAmountLabel: 'Çıxarılacaq Coin Məbləği',
      coinAmountPlaceholder: 'Minimum 100',
      withdrawAll: 'Hamısını Seç',
      coinRateInfo: '* 100 Coin = 1 Robux. Çıxarılan məbləğ 100-ün qatları olmalıdır.',
      willReceive: 'Alacağınız Robux Məbləği:',
      withdrawButton: 'Ödənişi Çək',
      howItWorks: 'Çıxarış Necə Həyata Keçirilir?',
      step1: 'Roblox istifadəçi adınızı daxil edin (Şifrə tələb olunmur).',
      step2: 'Qrupumuza qoşulmalısınız (Qrup üzvlüyü avtomatik yoxlanılır).',
      step3: 'Sistem qrup balansımızdan qeyd etdiyiniz məbləğdə Robux-u dərhal hesabınıza köçürür.',
      whyPayoutTitle: 'Niyə Payout?',
      whyPayoutText: 'Klassik gamepass satışında olduğu kimi 5 gün gözləmək məcburiyyətində deyilsiniz. Ödənişlər saniyələr içində dərhal baş tutur.',
      withdrawSuccessMsg: 'Təbriklər! Robux uğurla hesabınıza köçürüldü!',
      withdrawErrorMsg: 'Ödəniş əməliyyatı uğursuz oldu.',
      connectionError: 'Bağlantı xətası! Serverə qoşulmaq mümkün olmadı.',
      survey: 'Sorğu',
      social: 'Sosial',
      game: 'Oyun',
      comingSoon: 'Tezliklə'
    };
  } else {
    // Other languages get localization seeded elegantly with local identifiers and English fallbacks
    TRANSLATIONS[l.code] = {
      ...TRANSLATIONS.en,
      active: l.code.toUpperCase() === 'DE' ? 'AKTIV' : l.code.toUpperCase() === 'FR' ? 'ACTIF' : l.code.toUpperCase() === 'ES' ? 'ACTIVO' : 'ACTIVE',
      comingSoon: l.code === 'de' ? 'Demnächst' : l.code === 'fr' ? 'Bientôt' : l.code === 'es' ? 'Próximamente' : l.code === 'ru' ? 'Скоро' : 'Coming Soon'
    };
  }
});
