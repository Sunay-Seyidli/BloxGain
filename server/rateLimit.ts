import type { Request, Response, NextFunction } from 'express';

// Basit, bağımlılıksız IP-bazlı rate limiter. Tek sunuculu küçük/orta
// ölçekli dağıtımlar için yeterlidir. Çok sunuculu (multi-instance)
// dağıtımda Redis tabanlı bir çözüme (örn. rate-limiter-flexible) geçilmesi
// önerilir; bu dosyadaki yorum bunu hatırlatır.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Bellek sızıntısını önlemek için süresi dolmuş kayıtları periyodik temizle
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref();

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > options.max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        error: `Çok fazla istek gönderdiniz. Lütfen ${retryAfterSec} saniye sonra tekrar deneyin.`,
      });
    }

    next();
  };
}
