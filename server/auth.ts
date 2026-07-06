import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// JWT_SECRET .env dosyasında MUTLAKA tanımlanmalıdır. Sabit/varsayılan bir
// gizli anahtar KULLANILMAZ: eğer değişken tanımlı değilse sunucu hiç
// başlamaz. Bu, "herkesin tahmin edebileceği gizli anahtarla üretimde
// çalışma" riskini tamamen ortadan kaldırır.
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET .env dosyasında tanımlı değil ya da çok kısa (en az 16 karakter olmalı). ' +
        'Sunucu güvenlik nedeniyle başlatılamıyor.'
    );
  }
  return secret;
}

export interface AuthenticatedRequest extends Request {
  auth?: { userId: string; username: string };
}

// Bu middleware, Authorization: Bearer <token> header'ını doğrular ve
// çözümlenen kullanıcı bilgisini req.auth üzerine koyar. Body/query'den
// gelen "username" alanına ASLA güvenilmez; kimliğin tek doğru kaynağı
// budur.
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor.' });
  }

  try {
    // Algoritma açıkça 'HS256' olarak sabitleniyor. Bu olmadan, teorik
    // olarak bir saldırganın "alg: none" veya farklı bir algoritma ile
    // sahte bir token üretmeye çalıştığı "algorithm confusion" saldırı
    // sınıfına karşı ekstra bir güvenlik katmanı sağlanmış olur.
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as {
      userId: string;
      username: string;
    };
    req.auth = { userId: payload.userId, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Oturumunuzun süresi dolmuş veya geçersiz. Lütfen tekrar giriş yapın.' });
  }
}
