import mongoose from 'mongoose';
import crypto from 'crypto';

// User Schema for MongoDB
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  coinBalance: { type: Number, default: 150 }, // 150 welcome gift
  hasSpunToday: { type: Boolean, default: false },
  lastSpinAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as mongoose.Model<any>;

// Memory storage fallback for local development when MONGODB_URI is not set
class MemoryDb {
  private users: Map<string, any> = new Map();

  constructor() {
    console.log('⚠️ MongoDB URI is not set. Using safe in-memory fallback database for AI Studio Preview.');
    // Seed a default demo user
    this.users.set('robloxgamer_99', {
      _id: 'mem_user_1',
      username: 'RobloxGamer_99',
      email: 'gamer99@gmail.com',
      password: 'pbkdf2_or_bcrypt_stub',
      coinBalance: 450,
      hasSpunToday: false,
      lastSpinAt: null,
      createdAt: new Date()
    });
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

  async createUser(userData: any) {
    const usernameKey = userData.username.toLowerCase();
    const newUser = {
      _id: 'mem_user_' + Math.random().toString(36).substring(2, 9),
      coinBalance: 150,
      hasSpunToday: false,
      lastSpinAt: null,
      createdAt: new Date(),
      ...userData
    };
    this.users.set(usernameKey, newUser);
    return newUser;
  }

  async updateBalance(username: string, amount: number) {
    const user = await this.findUserByUsername(username);
    if (user) {
      user.coinBalance += amount;
      this.users.set(username.toLowerCase(), user);
      return user;
    }
    return null;
  }

  async setSpun(username: string, hasSpun: boolean, bakiyeEkle: number = 0) {
    const user = await this.findUserByUsername(username);
    if (user) {
      user.hasSpunToday = hasSpun;
      user.lastSpinAt = hasSpun ? new Date() : null;
      user.coinBalance += bakiyeEkle;
      this.users.set(username.toLowerCase(), user);
      return user;
    }
    return null;
  }
}

export const memoryDb = new MemoryDb();

let isConnected = false;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('username:password')) {
    return false;
  }

  if (isConnected) return true;

  try {
    // 5-second connection timeout to avoid blocking startup if database is unreachable
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('🔌 MongoDB Atlas connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    return false;
  }
}
