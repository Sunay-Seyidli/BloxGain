import mongoose from 'mongoose';

// ==========================================
// MONGODB SCHEMAS
// ==========================================
// NOT: coinBalance MODELDE hiçbir zaman doğrudan client'tan gelen bir
// değerle set edilmemeli. Her zaman sunucu tarafında hesaplanan bir
// miktar kadar artırılıp/azaltılmalı (bkz. server.ts).

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/, // Roblox kullanıcı adı kuralına uygun, injection'a kapalı
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: { type: String, required: true },
  coinBalance: { type: Number, default: 100, min: 0 }, // Kayıt bonusu
  hasSpunToday: { type: Boolean, default: false },
  lastSpinAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const PayoutSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  robuxAmount: { type: Number, required: true },
  gamepassId: { type: String, default: '' },
  status: { type: String, default: 'Onaylandı' },
  createdAt: { type: Date, default: Date.now },
});

// ayeT-Studios postback'lerinin ikinci kez işlenmesini (replay) engellemek için.
// transaction_id + partner alanı benzersiz olmalı.
const ProcessedTransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  coinAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = (mongoose.models.User ||
  mongoose.model('User', UserSchema)) as mongoose.Model<any>;
export const PayoutModel = (mongoose.models.Payout ||
  mongoose.model('Payout', PayoutSchema)) as mongoose.Model<any>;
export const ProcessedTransactionModel = (mongoose.models.ProcessedTransaction ||
  mongoose.model('ProcessedTransaction', ProcessedTransactionSchema)) as mongoose.Model<any>;

// ==========================================
// IN-MEMORY FALLBACK DATABASE
// ==========================================
// MONGODB_URI tanımlı değilse kullanılır. Sadece geliştirme/önizleme
// içindir; sunucu her yeniden başladığında veriler sıfırlanır.
// Üretimde MUTLAKA gerçek bir MongoDB bağlantısı kullanılmalıdır.

class MemoryDb {
  private users: Map<string, any> = new Map();
  private payouts: any[] = [];
  private processedTransactions: Set<string> = new Set();

  constructor() {
    console.log('⚠️  MONGODB_URI tanımlı değil. Geçici bellek-içi (in-memory) veritabanı kullanılıyor.');
    console.log('⚠️  Bu mod yalnızca geliştirme/test içindir. Sunucu yeniden başlatıldığında TÜM veriler silinir.');
  }

  async findUserByUsername(username: string) {
    return this.users.get(username.toLowerCase()) || null;
  }

  async findUserByEmail(email: string) {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    const usernameKey = userData.username.toLowerCase();
    const newUser = {
      _id: 'mem_user_' + Math.random().toString(36).substring(2, 9),
      coinBalance: 100, // Hoş geldin bonusu
      hasSpunToday: false,
      lastSpinAt: null,
      createdAt: new Date(),
      ...userData,
    };
    this.users.set(usernameKey, newUser);
    return newUser;
  }

  // amount pozitif ya da negatif olabilir; bakiyenin asla negatife
  // düşmemesi çağıran kod tarafından (server.ts) garanti edilmelidir.
  async updateBalance(username: string, amount: number) {
    const user = await this.findUserByUsername(username);
    if (user) {
      user.coinBalance = Math.max(0, user.coinBalance + amount);
      this.users.set(username.toLowerCase(), user);
      return user;
    }
    return null;
  }

  async setSpun(username: string, hasSpun: boolean, coinsToAdd: number = 0) {
    const user = await this.findUserByUsername(username);
    if (user) {
      user.hasSpunToday = hasSpun;
      user.lastSpinAt = hasSpun ? new Date() : null;
      user.coinBalance += coinsToAdd;
      this.users.set(username.toLowerCase(), user);
      return user;
    }
    return null;
  }

  async addPayout(username: string, robuxAmount: number, gamepassId: string = '', status: string = 'Onaylandı') {
    const newPayout = {
      username,
      robuxAmount,
      gamepassId,
      status,
      createdAt: new Date(),
    };
    this.payouts.unshift(newPayout);
    if (this.payouts.length > 30) {
      this.payouts.pop();
    }
    return newPayout;
  }

  async getRecentPayouts() {
    // Sadece gerçekten onaylanmış ödemeler döner — "Bekliyor" durumundaki
    // kayıtlar (ör. ROBLOX_COOKIE tanımlı değilken) canlı akışta
    // GÖSTERİLMEZ, aksi halde henüz gerçekleşmemiş bir ödeme gerçekleşmiş
    // gibi görünürdü.
    return this.payouts.filter((p) => p.status === 'Onaylandı');
  }

  // ---- Postback tekrar-oynatma (replay) koruması ----
  async isTransactionProcessed(transactionId: string) {
    return this.processedTransactions.has(transactionId);
  }

  async markTransactionProcessed(transactionId: string) {
    this.processedTransactions.add(transactionId);
  }
}

export const memoryDb = new MemoryDb();

// ==========================================
// MONGODB CONNECTION
// ==========================================

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('username:password')) {
    return false;
  }

  if (isConnected) return true;

  try {
    // Bağlantı yoksa sorguların sonsuza kadar beklemesini önlemek için
    // command buffering kapatılır; hatalar hızlıca fırlatılır.
    mongoose.set('bufferCommands', false);
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });

    isConnected = true;
    console.log('🔌 MongoDB Atlas bağlantısı başarıyla kuruldu.');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB Atlas bağlantısı kurulamadı:', error?.message || error);
    console.log('ℹ️  Bellek-içi (in-memory) veritabanına düşülüyor. Bu üretim ortamı için GÜVENLİ DEĞİLDİR.');
    return false;
  }
}
