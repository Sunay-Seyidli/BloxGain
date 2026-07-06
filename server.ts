import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import noblox from 'noblox.js';
import { createServer as createViteServer } from 'vite';
import {
  connectDatabase,
  UserModel,
  PayoutModel,
  ProcessedTransactionModel,
  memoryDb,
} from './server/db';
import { getJwtSecret, requireAuth, AuthenticatedRequest } from './server/auth';
import { rateLimit } from './server/rateLimit';

// Kullanıcıdan gelen bir metni MongoDB $regex sorgusunda güvenle
// kullanabilmek için regex özel karakterlerini escape eder. Bu olmadan
// bir kullanıcı adı/e-posta alanına özel regex karakterleri (., *, +,
// (a+)+ gibi ReDoS örüntüleri) girilerek hem performans saldırısı hem de
// beklenmeyen eşleşmeler (ör. "." herhangi bir karakterle eşleşir)
// yapılabilirdi.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ==========================================
// PROCESS SEVİYESİNDE ÇÖKME KORUMASI
// ==========================================
// Yakalanmamış bir hata veya reddedilen bir Promise, Node.js sürecini
// aniden sonlandırabilir (tüm kullanıcıların bağlantısı kopar). Bunun
// yerine hatayı logluyoruz; süreç ayakta kalır. (Not: Bu bir "her şeyi
// gizle" mekanizması değildir — sadece beklenmeyen bir hatanın tüm
// siteyi çökertmesini önler. Loglara düzenli bakmak yine de önemlidir.)
process.on('uncaughtException', (err) => {
  console.error('❌ Yakalanmamış istisna (uncaughtException):', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ İşlenmemiş promise reddi (unhandledRejection):', reason);
});

// ==========================================
// BAŞLANGIÇ GÜVENLİK KONTROLLERİ (FAIL-FAST)
// ==========================================
// Kritik bir gizli anahtar eksikse sunucu, güvensiz bir varsayılan
// değerle ayağa kalkmak yerine HİÇ başlamaz. Bu, "unuttum ama site
// yine de çalıştı, sonra hacklendi" senaryosunu engeller.
function assertRequiredEnv() {
  const missing: string[] = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    missing.push('JWT_SECRET (en az 16 karakter, rastgele bir değer)');
  }
  if (!process.env.AYET_API_KEY || process.env.AYET_API_KEY === 'YOUR_AYET_API_KEY_OR_SECRET') {
    console.warn(
      '⚠️  AYET_API_KEY tanımlı değil. ayeT-Studios postback doğrulaması ÇALIŞMAYACAK ve\n' +
        '    /api/v1/callback/ayet uç noktası devre dışı kalacak (istekler reddedilecek).\n' +
        '    ayeT Studios API anahtarınızı .env dosyasına ekleyince otomatik olarak aktif olur.'
    );
  }

  if (missing.length > 0) {
    console.error('❌ Sunucu başlatılamıyor. Eksik/geçersiz ortam değişkenleri:');
    missing.forEach((m) => console.error('   - ' + m));
    console.error('   Lütfen .env dosyanızı .env.example referans alarak doldurun.');
    process.exit(1);
  }
}

async function startServer() {
  assertRequiredEnv();

  const app = express();
  app.set('trust proxy', 1); // Render/Railway/Heroku gibi proxy arkasında doğru IP için

  // ==========================================
  // TEMEL GÜVENLİK HTTP BAŞLIKLARI
  // ==========================================
  // Ek bir paket (helmet vb.) kurmadan en kritik güvenlik başlıklarını
  // manuel olarak ekliyoruz: clickjacking, MIME-sniffing ve bazı XSS
  // vektörlerine karşı temel koruma sağlar.
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0'); // Modern tarayıcılarda devre dışı, CSP tercih edilir
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(express.json({ limit: '100kb' }));

  // express.json() bozuk/geçersiz JSON body aldığında hata fırlatır.
  // Bu middleware olmadan Express varsayılan (ve kullanıcıya teknik detay
  // sızdıran) bir hata sayfası gösterir. Burada yakalayıp temiz bir JSON
  // hata yanıtı dönüyoruz.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Geçersiz istek formatı.' });
    }
    next(err);
  });

  const dbConnected = await connectDatabase();
  const ayetApiKeyConfigured = Boolean(
    process.env.AYET_API_KEY && process.env.AYET_API_KEY !== 'YOUR_AYET_API_KEY_OR_SECRET'
  );

  // ==========================================
  // ORTAK YARDIMCI FONKSİYONLAR
  // ==========================================

  async function getUserBalance(username: string): Promise<number | null> {
    if (dbConnected) {
      const user = await UserModel.findOne({ username });
      return user ? user.coinBalance : null;
    }
    const user = await memoryDb.findUserByUsername(username);
    return user ? user.coinBalance : null;
  }

  function signToken(userId: string, username: string) {
    return jwt.sign({ userId, username }, getJwtSecret(), { expiresIn: '7d', algorithm: 'HS256' });
  }

  // ==========================================
  // 1. KİMLİK DOĞRULAMA (KAYIT & GİRİŞ)
  // ==========================================

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'auth' });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const { username, email, password } = req.body || {};

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
      }
      if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Geçersiz veri formatı.' });
      }

      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        return res.status(400).json({
          error: 'Kullanıcı adı 3-20 karakter olmalı ve sadece harf, rakam, alt çizgi içermelidir.',
        });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Şifreniz en az 8 karakter olmalıdır.' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      if (dbConnected) {
        const existingUser = await UserModel.findOne({
          $or: [{ username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, 'i') } }, { email: cleanEmail }],
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
        }

        const newUser = new UserModel({
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword,
          coinBalance: 100, // Hoş geldin bonusu
        });

        await newUser.save();

        const token = signToken(newUser._id.toString(), newUser.username);
        return res.json({
          message: 'Kayıt başarılı!',
          token,
          user: { username: newUser.username, email: newUser.email, balance: newUser.coinBalance },
        });
      } else {
        const existingUsername = await memoryDb.findUserByUsername(cleanUsername);
        const existingEmail = await memoryDb.findUserByEmail(cleanEmail);

        if (existingUsername || existingEmail) {
          return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
        }

        const newUser = await memoryDb.createUser({
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword,
        });

        const token = signToken(newUser._id, newUser.username);
        return res.json({
          message: 'Kayıt başarılı!',
          token,
          user: { username: newUser.username, email: newUser.email, balance: newUser.coinBalance },
        });
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      return res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const { username, password } = req.body || {};

      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Lütfen kullanıcı adı ve şifrenizi girin.' });
      }

      const cleanUsername = username.trim();

      // Zamanlama saldırılarını (timing attack) zorlaştırmak için kullanıcı
      // bulunamasa bile bir bcrypt karşılaştırması yapılır (dummy hash).
      const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7QsKUR/2y1Xn.YkV9U9k9nH9k9k9k9O';

      if (dbConnected) {
        const user = await UserModel.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, 'i') } },
            { email: cleanUsername.toLowerCase() },
          ],
        });

        const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
        if (!user || !isMatch) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const token = signToken(user._id.toString(), user.username);
        return res.json({
          message: 'Giriş başarılı!',
          token,
          user: { username: user.username, email: user.email, balance: user.coinBalance },
        });
      } else {
        const user =
          (await memoryDb.findUserByUsername(cleanUsername)) ||
          (await memoryDb.findUserByEmail(cleanUsername));

        const isMatch = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
        if (!user || !isMatch) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const token = signToken(user._id, user.username);
        return res.json({
          message: 'Giriş başarılı!',
          token,
          user: { username: user.username, email: user.email, balance: user.coinBalance },
        });
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      return res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
    }
  });

  // Oturum doğrulama / bakiye yenileme ucu — sayfa yenilendiğinde frontend
  // localStorage'daki bakiyeye değil, buna güvenir.
  const meLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: 'auth-me' });

  app.get('/api/auth/me', meLimiter, requireAuth, async (req: AuthenticatedRequest, res) => {
    const username = req.auth!.username;
    const balance = await getUserBalance(username);
    if (balance === null) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    return res.json({ username, balance });
  });

  // ==========================================
  // 2. ŞANS ÇARKI (SUNUCU TARAFINDA BELİRLENİR)
  // ==========================================

  const spinLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, keyPrefix: 'spin' });

  app.post('/api/wheel/spin', requireAuth, spinLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const username = req.auth!.username; // Body'den DEĞİL, doğrulanmış token'dan

      const prizes = [5, 20, 50, 10, 100, 15, 30, 200];
      const winningIndex = Math.floor(Math.random() * prizes.length);
      const selectedPrize = prizes[winningIndex];

      if (dbConnected) {
        const user = await UserModel.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const now = new Date();
        if (user.hasSpunToday && user.lastSpinAt) {
          const hoursSinceLastSpin = (now.getTime() - user.lastSpinAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSpin < 24) {
            return res.status(400).json({ error: 'Çarkıfeleği günde sadece 1 kez çevirebilirsiniz!' });
          }
          user.hasSpunToday = false;
        }

        user.coinBalance += selectedPrize;
        user.hasSpunToday = true;
        user.lastSpinAt = now;
        await user.save();

        return res.json({ winningIndex, prize: selectedPrize, newBalance: user.coinBalance });
      } else {
        const user = await memoryDb.findUserByUsername(username);
        if (!user) {
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const now = new Date();
        if (user.hasSpunToday && user.lastSpinAt) {
          const hoursSinceLastSpin = (now.getTime() - new Date(user.lastSpinAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSpin < 24) {
            return res.status(400).json({ error: 'Çarkıfeleği günde sadece 1 kez çevirebilirsiniz!' });
          }
        }

        const updatedUser = await memoryDb.setSpun(username, true, selectedPrize);
        return res.json({ winningIndex, prize: selectedPrize, newBalance: updatedUser.coinBalance });
      }
    } catch (error) {
      console.error('Spin Wheel Error:', error);
      return res.status(500).json({ error: 'Çark çevirme sırasında hata oluştu.' });
    }
  });

  // ==========================================
  // 3. AYET-STUDIOS OFFERWALL POSTBACK (SUNUCUDAN SUNUCUYA)
  // ==========================================
  // Bu uç nokta kullanıcı tarafından DEĞİL, ayeT-Studios'un kendi
  // sunucuları tarafından çağrılır ("server-to-server postback/callback").
  // Kullanıcı bir görevi tamamladığında ayeT-Studios bu URL'e GET isteği
  // atarak coin'in hesaba işlenmesini tetikler.
  //
  // GÜVENLİK NOTU: AYET_API_KEY tanımlı değilse bu uç nokta TAMAMEN
  // devre dışıdır (istekleri reddeder). Eskiden burada "anahtar yoksa
  // imza kontrolünü atla" gibi tehlikeli bir fallback vardı — kaldırıldı.
  //
  // İMZA FORMÜLÜ HAKKINDA: Aşağıdaki SHA256(transaction_id + api_key)
  // formülü ayeT-Studios'ta yaygın kullanılan bir postback doğrulama
  // yöntemidir, fakat ayeT Studios yayıncı panelinizdeki "Postback URL /
  // Security" sayfasında TAM formülü (bazı entegrasyonlarda parametrelerin
  // hepsi alfabetik sırayla birleştirilip hash'lenir, bazılarında sadece
  // transaction_id kullanılır) mutlaka kontrol edin ve gerekirse bu satırı
  // panelinizdeki formüle göre güncelleyin.
  const ayetLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: 'ayet' });

  app.get('/api/v1/callback/ayet', ayetLimiter, async (req, res) => {
    try {
      if (!ayetApiKeyConfigured) {
        return res
          .status(503)
          .send('ERROR: AYET_API_KEY sunucuda tanımlı değil. Lütfen .env dosyanıza ekleyin.');
      }

      const { uid, currency, transaction_id, signature } = req.query;

      if (!uid || !currency || !transaction_id || !signature) {
        return res.status(400).send('ERROR: Missing required callback parameters');
      }
      if (
        typeof uid !== 'string' ||
        typeof currency !== 'string' ||
        typeof transaction_id !== 'string' ||
        typeof signature !== 'string'
      ) {
        return res.status(400).send('ERROR: Invalid parameter types');
      }

      const apiKey = process.env.AYET_API_KEY as string;

      const computedSignature = crypto
        .createHash('sha256')
        .update(`${transaction_id}${apiKey}`)
        .digest('hex');

      // Zamanlama saldırılarına karşı sabit-zamanlı karşılaştırma
      const providedBuf = Buffer.from(signature);
      const computedBuf = Buffer.from(computedSignature);
      const isSignatureValid =
        providedBuf.length === computedBuf.length && crypto.timingSafeEqual(providedBuf, computedBuf);

      if (!isSignatureValid) {
        console.warn(`⚠️  Geçersiz ayeT-Studios imzası. transaction_id: ${transaction_id}`);
        return res.status(403).send('ERROR: Invalid verification signature');
      }

      // Replay koruması: aynı transaction_id iki kez işlenemez.
      if (dbConnected) {
        const existing = await ProcessedTransactionModel.findOne({ transactionId: transaction_id });
        if (existing) {
          // ayeT-Studios postback'i tekrar gönderebilir; idempotent şekilde OK dön.
          return res.send('OK');
        }
      } else {
        if (await memoryDb.isTransactionProcessed(transaction_id)) {
          return res.send('OK');
        }
      }

      const coinAmount = parseInt(currency, 10);
      if (isNaN(coinAmount) || coinAmount <= 0 || coinAmount > 1_000_000) {
        return res.status(400).send('ERROR: Invalid currency amount');
      }

      if (dbConnected) {
        const user = await UserModel.findOne({ username: uid });
        if (!user) {
          return res.status(404).send('ERROR: User not found in database');
        }
        user.coinBalance += coinAmount;
        await user.save();
        await ProcessedTransactionModel.create({
          transactionId: transaction_id,
          username: uid,
          coinAmount,
        });
      } else {
        const user = await memoryDb.findUserByUsername(uid);
        if (!user) {
          return res.status(404).send('ERROR: User not found in fallback database');
        }
        await memoryDb.updateBalance(uid, coinAmount);
        await memoryDb.markTransactionProcessed(transaction_id);
      }

      console.log(`✅ ayeT-Studios postback işlendi. Kullanıcı: ${uid}, Coin: +${coinAmount}, TX: ${transaction_id}`);
      return res.send('OK'); // ayeT-Studios başarı için düz metin 'OK' bekler
    } catch (error) {
      console.error('ayeT Callback Error:', error);
      return res.status(500).send('ERROR: Internal Server Error');
    }
  });

  // ==========================================
  // ROBLOX AVATAR SORGULAMA
  // ==========================================

  const robloxLookupLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: 'roblox-lookup' });

  app.get('/api/roblox/avatar', robloxLookupLimiter, async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
      }
      if (username.length > 20) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı adı.' });
      }

      let userId: number;
      try {
        userId = await noblox.getIdFromUsername(username);
      } catch {
        const fetchRes = await fetch(
          `https://users.roblox.com/v1/users/profiles?usernames=${encodeURIComponent(username)}`
        );
        if (!fetchRes.ok) {
          return res.status(404).json({ error: 'Roblox kullanıcısı bulunamadı' });
        }
        const fetchJson: any = await fetchRes.json();
        if (!fetchJson.data || fetchJson.data.length === 0) {
          return res.status(404).json({ error: 'Roblox kullanıcısı bulunamadı' });
        }
        userId = fetchJson.data[0].id;
      }

      if (!userId) {
        return res.status(404).json({ error: 'Roblox kullanıcısı bulunamadı' });
      }

      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
      );
      let avatarUrl = '';
      if (thumbRes.ok) {
        const thumbJson: any = await thumbRes.json();
        if (thumbJson.data && thumbJson.data.length > 0) {
          avatarUrl = thumbJson.data[0].imageUrl;
        }
      }

      if (!avatarUrl) {
        avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
      }

      return res.json({ userId, avatarUrl, username });
    } catch (error: any) {
      console.error('Roblox Avatar Lookup Error:', error);
      return res.status(500).json({ error: 'Roblox kullanıcısı bulunamadı veya bilgi alınamadı' });
    }
  });

  // ==========================================
  // ROBLOX OYUN & GAMEPASS SORGULAMA
  // ==========================================

  app.get('/api/roblox/games', robloxLookupLimiter, async (req, res) => {
    try {
      const username = req.query.username;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Username parameter is required' });
      }
      if (username.length > 20) {
        return res.status(400).json({ error: 'Geçersiz kullanıcı adı.' });
      }

      const userRes = await fetch(
        `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`
      );
      if (!userRes.ok) {
        return res.status(502).json({ error: 'Roblox API şu anda yanıt vermiyor.' });
      }
      const userJson: any = await userRes.json();
      if (!userJson.data || userJson.data.length === 0) {
        return res.status(404).json({ error: 'Roblox kullanıcısı bulunamadı' });
      }

      const userId = userJson.data[0].id;

      const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
      let gamesList: any[] = [];
      let gamepassesList: any[] = [];

      if (gamesRes.ok) {
        const gamesJson: any = await gamesRes.json();
        if (gamesJson.data && gamesJson.data.length > 0) {
          gamesList = gamesJson.data.map((g: any) => ({
            id: g.id.toString(),
            name: g.name,
            rootPlaceId: g.rootPlace ? g.rootPlace.id.toString() : '',
          }));

          const passPromises = gamesList.map(async (game) => {
            try {
              const passRes = await fetch(`https://games.roblox.com/v1/games/${game.id}/game-passes?limit=25`);
              if (passRes.ok) {
                const passJson: any = await passRes.json();
                if (passJson.data && passJson.data.length > 0) {
                  passJson.data.forEach((p: any) => {
                    gamepassesList.push({
                      id: p.id.toString(),
                      name: p.name,
                      price: p.priceInRobux || 0,
                      universeId: game.id,
                    });
                  });
                }
              }
            } catch (err) {
              console.error(`Error fetching gamepasses for game ${game.id}:`, err);
            }
          });

          await Promise.all(passPromises);
        }
      }

      // Kullanıcının hiç oyunu/gamepass'i yoksa boş liste dön — sahte/uydurma
      // veri ARTIK gösterilmiyor. Frontend bu durumda "manuel gamepass ID
      // girin" seçeneğini sunar.
      return res.json({ userId, games: gamesList, gamepasses: gamepassesList });
    } catch (err: any) {
      console.error('Error in /api/roblox/games:', err);
      return res.status(502).json({ error: 'Roblox verileri alınırken bir hata oluştu. Lütfen tekrar deneyin.' });
    }
  });

  // ==========================================
  // 4. ROBLOX GAMEPASS ÖDEME (NOBLOX.JS)
  // ==========================================

  const payoutLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'payout' });

  app.post('/api/payout/request', requireAuth, payoutLimiter, async (req: AuthenticatedRequest, res) => {
    try {
      const username = req.auth!.username; // Doğrulanmış kullanıcı — body'den değil
      const { amount, gamepassId } = req.body || {};

      if (!amount || !gamepassId) {
        return res.status(400).json({ error: 'Miktar ve Gamepass ID/bağlantısı gereklidir.' });
      }

      const amountNum = parseInt(amount, 10);
      if (isNaN(amountNum) || amountNum < 1000) {
        return res.status(400).json({ error: 'Robux çekebilmek için minimum 1000 Coin (10 Robux) bakiyenizin olması gereklidir!' });
      }

      const numericIdMatch = String(gamepassId).match(/\d+/);
      if (!numericIdMatch) {
        return res.status(400).json({ error: 'Geçersiz Gamepass ID formatı! Sadece sayı girmelisiniz.' });
      }
      const finalGamepassId = parseInt(numericIdMatch[0], 10);

      // ---- Atomik bakiye düşürme ----
      // Aynı kullanıcının art arda çok hızlı istek atarak bakiyesinin
      // eksiye düşmesini (race condition / double-spend) önlemek için
      // MongoDB'de "yeterli bakiye varsa düş" işlemi TEK bir atomik
      // sorguda yapılır. Önce oku-sonra-yaz (read-then-write) YAPILMAZ.
      const robuxToSend = Math.floor(amountNum / 100);

      let deducted = false;
      if (dbConnected) {
        const updatedUser = await UserModel.findOneAndUpdate(
          { username, coinBalance: { $gte: amountNum } },
          { $inc: { coinBalance: -amountNum } },
          { new: true }
        );
        deducted = Boolean(updatedUser);
      } else {
        const user = await memoryDb.findUserByUsername(username);
        if (user && user.coinBalance >= amountNum) {
          await memoryDb.updateBalance(username, -amountNum);
          deducted = true;
        }
      }

      if (!deducted) {
        return res.status(400).json({ error: 'Yetersiz bakiye!' });
      }

      const robloxCookie = process.env.ROBLOX_COOKIE;
      const cookieConfigured = Boolean(robloxCookie && robloxCookie !== 'WARNING_DO_NOT_SHARE_THIS_COOKIE');

      if (!cookieConfigured) {
        // ROBLOX_COOKIE tanımlı değilse gerçek bir ödeme YAPILAMAZ.
        // Bakiye zaten düşüldüğü için işlemi "beklemede" (Bekliyor) olarak
        // kaydediyoruz ki .env doldurulup sunucu yeniden başlatıldığında
        // (veya bir yönetici tarafından manuel olarak) işlenebilsin.
        // ESKİDEN burada "ödeme onaylandı" diye YALAN bir mesaj
        // gösteriliyordu — bu kaldırıldı.
        if (dbConnected) {
          await new PayoutModel({
            username,
            robuxAmount: robuxToSend,
            gamepassId: finalGamepassId.toString(),
            status: 'Bekliyor (ROBLOX_COOKIE tanımlı değil)',
          }).save();
        } else {
          await memoryDb.addPayout(
            username,
            robuxToSend,
            finalGamepassId.toString(),
            'Bekliyor (ROBLOX_COOKIE tanımlı değil)'
          );
        }

        console.warn(
          `⚠️  ROBLOX_COOKIE tanımlı değil. Ödeme talebi (${robuxToSend} Robux, @${username}) 'Bekliyor' olarak kaydedildi ama GERÇEKTEN GÖNDERİLMEDİ.`
        );

        return res.status(202).json({
          success: false,
          pending: true,
          message:
            'Bakiyeniz düşüldü ve talebiniz kayda alındı, fakat site sahibi henüz ödeme botunu (ROBLOX_COOKIE) yapılandırmadığı için Robux otomatik gönderilemiyor. Lütfen site yöneticisiyle iletişime geçin.',
        });
      }

      try {
        await noblox.setCookie(robloxCookie as string);
        await (noblox as any).buy(finalGamepassId);

        if (dbConnected) {
          await new PayoutModel({
            username,
            robuxAmount: robuxToSend,
            gamepassId: finalGamepassId.toString(),
            status: 'Onaylandı',
          }).save();
        } else {
          await memoryDb.addPayout(username, robuxToSend, finalGamepassId.toString());
        }

        return res.json({
          success: true,
          message: `${robuxToSend} Robux değerindeki Gamepass başarıyla satın alındı! Roblox kesintisi nedeniyle net tutar hesabınıza birkaç gün içinde yansıyacaktır.`,
        });
      } catch (robloxErr: any) {
        // Roblox tarafı BAŞARISIZ oldu: kullanıcıdan düşülen bakiyeyi geri
        // iade ediyoruz. Aksi halde kullanıcı hem coin'ini hem de Robux'unu
        // kaybederdi.
        if (dbConnected) {
          await UserModel.findOneAndUpdate({ username }, { $inc: { coinBalance: amountNum } });
        } else {
          await memoryDb.updateBalance(username, amountNum);
        }

        console.error('❌ Roblox API Error during transaction:', robloxErr);
        return res.status(502).json({
          error: `Roblox işlemi sırasında hata oluştu, bakiyeniz iade edildi: ${robloxErr.message || robloxErr}`,
        });
      }
    } catch (error: any) {
      console.error('Payout Request Error:', error);
      return res.status(500).json({ error: 'Ödeme işlemi başlatılırken sistemsel bir hata oluştu.' });
    }
  });

  // ==========================================
  // CANLI ÖDEME AKIŞI
  // ==========================================

  const feedLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, keyPrefix: 'payout-feed' });

  app.get('/api/payout/feed', feedLimiter, async (req, res) => {
    try {
      if (dbConnected) {
        const payouts = await PayoutModel.find({ status: 'Onaylandı' }).sort({ createdAt: -1 }).limit(10);
        return res.json({ payouts });
      } else {
        const payouts = await memoryDb.getRecentPayouts();
        return res.json({ payouts });
      }
    } catch (err: any) {
      console.error('Error fetching live feed:', err);
      return res.status(500).json({ error: 'Canlı akış yüklenemedi.' });
    }
  });

  // ==========================================
  // 5. VITE DEV MIDDLEWARE / PRODUCTION STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ==========================================
  // GENEL (CATCH-ALL) HATA YAKALAYICI
  // ==========================================
  // Her uç nokta kendi try/catch bloğuna sahip olsa da, beklenmeyen bir
  // hata (örn. bir kütüphanenin senkron fırlattığı hata) sunucuyu
  // çökertmesin ve kullanıcıya teknik yığın izini (stack trace) asla
  // sızdırmasın diye son bir güvenlik ağı ekleniyor.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Beklenmeyen sunucu hatası:', err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: 'Beklenmeyen bir sunucu hatası oluştu.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BloxGain sunucusu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`📦 Veritabanı: ${dbConnected ? 'MongoDB Atlas bağlı' : 'In-memory fallback (SADECE GELİŞTİRME İÇİN)'}`);
    console.log(`🎯 ayeT-Studios postback: ${ayetApiKeyConfigured ? 'AKTİF' : 'PASİF (AYET_API_KEY eksik)'}`);
    console.log(
      `💸 Roblox otomatik ödeme: ${
        process.env.ROBLOX_COOKIE && process.env.ROBLOX_COOKIE !== 'WARNING_DO_NOT_SHARE_THIS_COOKIE'
          ? 'AKTİF'
          : 'PASİF (ROBLOX_COOKIE eksik — talepler "Bekliyor" olarak kuyruklanacak)'
      }`
    );
  });
}

startServer();
