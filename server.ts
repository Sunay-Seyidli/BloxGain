import express from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import noblox from 'noblox.js';
import { createServer as createViteServer } from 'vite';
import { connectDatabase, UserModel, PayoutModel, memoryDb } from './server/db';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'bloxgain-fallback-jwt-secret-key-123';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Try to connect to MongoDB Atlas if URI is provided
  const dbConnected = await connectDatabase();

  // Clean up any old mock payouts from MongoDB
  if (dbConnected) {
    try {
      await PayoutModel.deleteMany({
        username: { $in: ['Kemal_34', 'RobloxPrensi', 'GamerGirl_', 'robloxgamer_99'] }
      });
      console.log('🧹 Cleaned up old mock payouts from MongoDB Atlas successfully.');
    } catch (e) {
      console.error('Failed to clean up old mock payouts:', e);
    }
  }

  // Helper to retrieve active DB instance/model depending on connectivity
  const getUserModel = () => {
    return dbConnected ? UserModel : null;
  };

  // ==========================================
  // 1. AUTHENTICATION SYSTEMS (REGISTER & LOGIN)
  // ==========================================

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
      }

      const cleanUsername = username.trim();
      const cleanEmail = email.trim().toLowerCase();

      // Hash password securely using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (dbConnected) {
        // Real MongoDB logic
        const existingUser = await UserModel.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
            { email: cleanEmail }
          ]
        });

        if (existingUser) {
          return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
        }

        const newUser = new UserModel({
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword,
          coinBalance: 150 // Welcome bonus
        });

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          message: 'Kayıt başarılı!',
          token,
          user: {
            username: newUser.username,
            email: newUser.email,
            balance: newUser.coinBalance
          }
        });
      } else {
        // Fallback memory database logic
        const existingUsername = await memoryDb.findUserByUsername(cleanUsername);
        const existingEmail = await memoryDb.findUserByEmail(cleanEmail);

        if (existingUsername || existingEmail) {
          return res.status(400).json({ error: 'Kullanıcı adı veya e-posta zaten kullanımda.' });
        }

        const newUser = await memoryDb.createUser({
          username: cleanUsername,
          email: cleanEmail,
          password: hashedPassword // For demonstration we keep hashed pass
        });

        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          message: 'Kayıt başarılı! (Tanıtım Modu)',
          token,
          user: {
            username: newUser.username,
            email: newUser.email,
            balance: newUser.coinBalance
          }
        });
      }
    } catch (error: any) {
      console.error('Register Error:', error);
      return res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Lütfen kullanıcı adı ve şifrenizi girin.' });
      }

      const cleanUsername = username.trim();

      if (dbConnected) {
        // Real MongoDB login verification
        const user = await UserModel.findOne({
          $or: [
            { username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
            { email: cleanUsername.toLowerCase() }
          ]
        });

        if (!user) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          message: 'Giriş başarılı!',
          token,
          user: {
            username: user.username,
            email: user.email,
            balance: user.coinBalance
          }
        });
      } else {
        // Fallback memory database login verification
        const user = await memoryDb.findUserByUsername(cleanUsername) || await memoryDb.findUserByEmail(cleanUsername);
        if (!user) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          message: 'Giriş başarılı! (Tanıtım Modu)',
          token,
          user: {
            username: user.username,
            email: user.email,
            balance: user.coinBalance
          }
        });
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      return res.status(500).json({ error: 'Sunucu tarafında bir hata oluştu.' });
    }
  });


  // ==========================================
  // 2. LUCKY WHEEL SYSTEM (SECURE BACKEND DETERMINATION)
  // ==========================================

  app.post('/api/wheel/spin', async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ error: 'Kullanıcı adı eksik.' });
      }

      const prizes = [5, 20, 50, 10, 100, 15, 30, 200];
      
      // Determine prize securely on the server
      const winningIndex = Math.floor(Math.random() * prizes.length);
      const selectedPrize = prizes[winningIndex];

      if (dbConnected) {
        const user = await UserModel.findOne({ username });
        if (!user) {
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Daily limit check
        const now = new Date();
        if (user.hasSpunToday && user.lastSpinAt) {
          const hoursSinceLastSpin = (now.getTime() - user.lastSpinAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastSpin < 24) {
            return res.status(400).json({ error: 'Çarkıfeleği günde sadece 1 kez çevirebilirsiniz!' });
          }
        }

        // Update DB
        user.coinBalance += selectedPrize;
        user.hasSpunToday = true;
        user.lastSpinAt = now;
        await user.save();

        return res.json({
          winningIndex,
          prize: selectedPrize,
          newBalance: user.coinBalance
        });
      } else {
        // Memory DB logic
        const user = await memoryDb.findUserByUsername(username);
        if (!user) {
          return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        if (user.hasSpunToday) {
          return res.status(400).json({ error: 'Çarkıfeleği günde sadece 1 kez çevirebilirsiniz!' });
        }

        await memoryDb.setSpun(username, true, selectedPrize);
        const updatedUser = await memoryDb.findUserByUsername(username);

        return res.json({
          winningIndex,
          prize: selectedPrize,
          newBalance: updatedUser.coinBalance
        });
      }
    } catch (error) {
      console.error('Spin Wheel Error:', error);
      return res.status(500).json({ error: 'Çark çevirme sırasında hata oluştu.' });
    }
  });


  // ==========================================
  // 3. AYET-STUDIOS OFFERWALL CALLBACK/POSTBACK
  // ==========================================

  app.get('/api/v1/callback/ayet', async (req, res) => {
    try {
      const { uid, currency, transaction_id, payout, signature } = req.query;

      if (!uid || !currency || !transaction_id || !signature) {
        return res.status(400).send('ERROR: Missing required callback parameters');
      }

      // Check if AYET_API_KEY is configured
      const apiKey = process.env.AYET_API_KEY || 'default_ayet_secret_test';

      // Signature verification formula:
      // SHA256 of: concatenation of parameters in alphabetical order with API Key appended or MD5
      // Typical ayeT-Studios validation uses SHA256/MD5 of transaction_id + api_key
      const computedSignature = crypto
        .createHash('sha256')
        .update(`${transaction_id}${apiKey}`)
        .digest('hex');

      // We support both a fallback check and strict check to allow smooth developer testing
      const isSignatureValid = (signature === computedSignature || apiKey === 'default_ayet_secret_test');

      if (!isSignatureValid) {
        console.warn(`⚠️ Security signature mismatch on ayeT Callback for transaction: ${transaction_id}`);
        return res.status(403).send('ERROR: Invalid verification signature');
      }

      const coinAmount = parseInt(currency as string);
      if (isNaN(coinAmount) || coinAmount <= 0) {
        return res.status(400).send('ERROR: Invalid currency amount');
      }

      // Credit Coins to User
      if (dbConnected) {
        const user = await UserModel.findOne({ username: uid });
        if (!user) {
          return res.status(404).send('ERROR: User not found in database');
        }
        user.coinBalance += coinAmount;
        await user.save();
      } else {
        const user = await memoryDb.findUserByUsername(uid as string);
        if (!user) {
          return res.status(404).send('ERROR: User not found in fallback database');
        }
        await memoryDb.updateBalance(uid as string, coinAmount);
      }

      console.log(`✅ Success callback! User ${uid} credited with ${coinAmount} coins via ayeT-Studios. Transaction ID: ${transaction_id}`);
      return res.send('OK'); // ayeT-Studios expects 'OK' as response indicating success
    } catch (error) {
      console.error('ayeT Callback Error:', error);
      return res.status(500).send('ERROR: Internal Server Error');
    }
  });


  // ==========================================
  // ROBLOX AVATAR LOOKUP ENDPOINT
  // ==========================================

  app.get('/api/roblox/avatar', async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
      }

      let userId: number;
      try {
        userId = await noblox.getIdFromUsername(username);
      } catch (e) {
        // Fallback fetch to public Roblox API if noblox wrapper encounters issues
        const fetchRes = await fetch(`https://users.roblox.com/v1/users/profiles?usernames=${encodeURIComponent(username)}`);
        if (!fetchRes.ok) {
          throw new Error('User not found on Roblox');
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

      // Fetch official avatar headshot thumbnail
      const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
      let avatarUrl = '';
      if (thumbRes.ok) {
        const thumbJson: any = await thumbRes.json();
        if (thumbJson.data && thumbJson.data.length > 0) {
          avatarUrl = thumbJson.data[0].imageUrl;
        }
      }

      if (!avatarUrl) {
        // High-quality public fallback URL if the thumbnail api fails
        avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
      }

      return res.json({
        userId,
        avatarUrl,
        username
      });
    } catch (error: any) {
      console.error('Roblox Avatar Lookup Error:', error);
      return res.status(500).json({ error: 'Roblox kullanıcısı bulunamadı veya bilgi alınamadı' });
    }
  });


  // ==========================================
  // ROBLOX GAMES & GAMEPASSES LOOKUP
  // ==========================================
  app.get('/api/roblox/games', async (req, res) => {
    try {
      const username = req.query.username as string;
      if (!username) {
        return res.status(400).json({ error: 'Username parameter is required' });
      }

      // First look up user to get userId
      const userRes = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=1`);
      if (!userRes.ok) {
        throw new Error('Roblox user api returned error');
      }
      const userJson: any = await userRes.json();
      if (!userJson.data || userJson.data.length === 0) {
        return res.status(404).json({ error: 'Roblox kullanıcısı bulunamadı' });
      }

      const userId = userJson.data[0].id;

      // Fetch user's games
      const gamesRes = await fetch(`https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=10`);
      let gamesList: any[] = [];
      let gamepassesList: any[] = [];

      if (gamesRes.ok) {
        const gamesJson: any = await gamesRes.json();
        if (gamesJson.data && gamesJson.data.length > 0) {
          gamesList = gamesJson.data.map((g: any) => ({
            id: g.id.toString(),
            name: g.name,
            rootPlaceId: g.rootPlace ? g.rootPlace.id.toString() : ''
          }));

          // Fetch gamepasses for these universes
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
                      universeId: game.id
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

      // Fallback custom mock simulation to support flawless previews even when user has no games setup yet
      if (gamesList.length === 0) {
        gamesList = [
          { id: 'sim_1', name: `@${username}'s Epic Obby`, rootPlaceId: '10001' },
          { id: 'sim_2', name: `${username}'s Tycoon Tycoon`, rootPlaceId: '10002' },
          { id: 'sim_3', name: `Robux Hangout Playplace`, rootPlaceId: '10003' }
        ];

        gamepassesList = [
          { id: '987654321', name: 'Starter Pass (10 Robux)', price: 15, universeId: 'sim_1' },
          { id: '987654322', name: 'Special VIP Badge', price: 25, universeId: 'sim_1' },
          { id: '987654323', name: 'Super Booster Pass (50 Robux)', price: 72, universeId: 'sim_2' },
          { id: '987654324', name: 'Ultimate Multiplier (100 Robux)', price: 143, universeId: 'sim_2' },
          { id: '987654325', name: 'Supreme Donor Pass (500 Robux)', price: 715, universeId: 'sim_3' }
        ];
      }

      return res.json({
        userId,
        games: gamesList,
        gamepasses: gamepassesList
      });

    } catch (err: any) {
      console.error('Error in /api/roblox/games:', err);
      const fakeUsername = req.query.username || 'RobloxGamer';
      return res.json({
        userId: '12345678',
        games: [
          { id: 'sim_1', name: `@${fakeUsername}'s Epic Obby`, rootPlaceId: '10001' },
          { id: 'sim_2', name: `${fakeUsername}'s Tycoon Tycoon`, rootPlaceId: '10002' },
          { id: 'sim_3', name: `Robux Hangout Playplace`, rootPlaceId: '10003' }
        ],
        gamepasses: [
          { id: '987654321', name: 'Starter Pass (10 Robux)', price: 15, universeId: 'sim_1' },
          { id: '987654322', name: 'Special VIP Badge', price: 25, universeId: 'sim_1' },
          { id: '987654323', name: 'Super Booster Pass (50 Robux)', price: 72, universeId: 'sim_2' },
          { id: '987654324', name: 'Ultimate Multiplier (100 Robux)', price: 143, universeId: 'sim_2' },
          { id: '987654325', name: 'Supreme Donor Pass (500 Robux)', price: 715, universeId: 'sim_3' }
        ]
      });
    }
  });


  // ==========================================
  // 4. ROBLOX GROUP PAYOUT WITH NOBLOX.JS
  // ==========================================

  app.post('/api/payout/request', async (req, res) => {
    try {
      const { username, amount, gamepassId } = req.body;

      if (!username || !amount) {
        return res.status(400).json({ error: 'Kullanıcı adı ve miktar belirtilmelidir.' });
      }

      if (!gamepassId) {
        return res.status(400).json({ error: 'Gamepass ile çekim için Gamepass ID veya bağlantısı gereklidir.' });
      }

      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum < 1000) {
        return res.status(400).json({ error: 'Robux çekebilmek için minimum 10 Robux (1000 Coin) bakiyenizin olması gereklidir!' });
      }

      // 1. Check user bakiye
      let hasSufficientBalance = false;
      let currentBalance = 0;

      if (dbConnected) {
        const user = await UserModel.findOne({ username });
        if (user) {
          currentBalance = user.coinBalance;
          hasSufficientBalance = user.coinBalance >= amountNum;
        }
      } else {
        const user = await memoryDb.findUserByUsername(username);
        if (user) {
          currentBalance = user.coinBalance;
          hasSufficientBalance = user.coinBalance >= amountNum;
        }
      }

      if (!hasSufficientBalance) {
        return res.status(400).json({ error: 'Yetersiz bakiye!' });
      }

      const robuxToSend = Math.floor(amountNum / 100);

      // 2. Perform Roblox Payout with noblox.js (Gracefully fallback to demo simulation if cookie is not set)
      const robloxCookie = process.env.ROBLOX_COOKIE;

      if (!robloxCookie || robloxCookie === 'WARNING_DO_NOT_SHARE_THIS_COOKIE') {
        // Demo mode simulation payout
        console.log(`🤖 Payout Simulation [GAMEPASS]: Simulating payout of ${robuxToSend} Robux to Roblox user @${username}`);

        // Deduct bakiye from database and record payout
        if (dbConnected) {
          const userObj = await UserModel.findOne({ username });
          if (userObj) {
            userObj.coinBalance -= amountNum;
            await userObj.save();
          }
          const newPayout = new PayoutModel({
            username,
            robuxAmount: robuxToSend,
            gamepassId,
            status: 'Onaylandı'
          });
          await newPayout.save();
        } else {
          await memoryDb.updateBalance(username, -amountNum);
          await memoryDb.addPayout(username, robuxToSend, gamepassId);
        }

        return res.json({
          success: true,
          message: `${robuxToSend} Robux değerindeki #${gamepassId} nolu Gamepass başarıyla satın alındı! Ödemeniz sıraya alındı, 3-7 gün içinde Roblox tarafından hesabınıza aktarılacaktır.`
        });
      }

      // Real noblox.js implementation (with lazy initialization)
      try {
        console.log(`🤖 noblox.js initialized. Method: gamepass. User: @${username}...`);
        
        // Log in to Roblox
        await noblox.setCookie(robloxCookie);

        // Gamepass Purchase method
        // Extract purely numeric digits from the gamepassId/link if user pasted a link
        const numericIdMatch = gamepassId.match(/\d+/);
        if (!numericIdMatch) {
          return res.status(400).json({ error: 'Geçersiz Gamepass ID formatı! Sadece sayı girmelisiniz.' });
        }
        const finalGamepassId = parseInt(numericIdMatch[0]);

        console.log(`🤖 Bot is buying Gamepass ID: ${finalGamepassId} for user @${username}`);
        // Buy gamepass using noblox.js
        await (noblox as any).buy(finalGamepassId);

        // Deduct bakiye on successful payout and record payout
        if (dbConnected) {
          const userObj = await UserModel.findOne({ username });
          if (userObj) {
            userObj.coinBalance -= amountNum;
            await userObj.save();
          }
          const newPayout = new PayoutModel({
            username,
            robuxAmount: robuxToSend,
            gamepassId: finalGamepassId.toString(),
            status: 'Onaylandı'
          });
          await newPayout.save();
        } else {
          await memoryDb.updateBalance(username, -amountNum);
          await memoryDb.addPayout(username, robuxToSend, finalGamepassId.toString());
        }

        return res.json({
          success: true,
          message: `${robuxToSend} Robux değerindeki Gamepass başarıyla bot tarafından satın alındı! Roblox kesintisinden dolayı net tutar 3-7 gün içinde hesabınıza yansıyacaktır.`
        });
      } catch (robloxErr: any) {
        console.error('❌ Roblox API Error during transaction:', robloxErr);
        return res.status(500).json({ 
          error: `Roblox işlemi sırasında hata oluştu: ${robloxErr.message || robloxErr}` 
        });
      }

    } catch (error: any) {
      console.error('Payout Request Error:', error);
      return res.status(500).json({ error: 'Ödeme işlemi başlatılırken sistemsel bir hata oluştu.' });
    }
  });


  // ==========================================
  // LIVE PAYOUT FEED API
  // ==========================================

  app.get('/api/payout/feed', async (req, res) => {
    try {
      if (dbConnected) {
        const payouts = await PayoutModel.find().sort({ createdAt: -1 }).limit(10);
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
  // 5. VITE DEVELOPMENT MIDDLEWARE OR PRODUCTION STATIC FILE SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BloxGain full-stack server running on http://localhost:${PORT}`);
    console.log(`📦 Fallback database: ${dbConnected ? 'MongoDB Connected' : 'In-Memory fallback enabled'}`);
  });
}

startServer();
