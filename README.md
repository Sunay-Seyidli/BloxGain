# BloxGain

Görev tamamlayarak / şans çarkı çevirerek Coin kazanılan ve Coin'in Roblox
Gamepass sistemi üzerinden Robux'a çevrilebildiği bir GPT (Get-Paid-To)
platformu.

Bu sürüm, orijinal projedeki tüm güvenlik açıklarının kapatıldığı,
sahte/demo verilerin temizlendiği ve gerçek bir ayeT-Studios entegrasyonuna
hazır hale getirilmiş halidir. Aşağıda ne değiştiğini ve nasıl kuracağınızı
bulabilirsiniz.

---

## 1. Hızlı Kurulum

```bash
npm install
cp .env.example .env
# .env dosyasını kendi bilgilerinizle doldurun (aşağıya bakın)
npm run dev
```

Üretim için:

```bash
npm run build
npm start
```

---

## 2. .env dosyasını doldurma

`.env.example` dosyasını `.env` olarak kopyalayın ve şu alanları doldurun:

| Değişken | Zorunlu mu? | Açıklama |
|---|---|---|
| `MONGODB_URI` | Üretimde zorunlu | Kalıcı veritabanı. Boş bırakılırsa sunucu geçici bellek-içi veritabanı kullanır (sunucu yeniden başlayınca veriler silinir — **sadece test için**). |
| `JWT_SECRET` | **Zorunlu** | En az 16 karakter rastgele bir dize. Tanımlı değilse sunucu **hiç başlamaz** (güvenlik). Üretmek için: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `AYET_API_KEY` | Coin kazanma sistemi için zorunlu | Aşağıdaki bölümde nasıl alınacağı anlatılıyor. |
| `VITE_AYET_OFFERWALL_ID` | Coin kazanma sistemi için zorunlu | ayeT Studios Offerwall/Placement ID'niz. |
| `ROBLOX_COOKIE` | İsteğe bağlı | Tanımlıysa Robux ödemeleri otomatik gönderilir. Tanımlı değilse ödeme talepleri "Bekliyor" olarak kuyruğa alınır, kullanıcı yalan bir "onaylandı" mesajı görmez. |

`.env` dosyanızı **asla** GitHub'a veya herkese açık bir yere yüklemeyin.
`.gitignore` içinde zaten hariç tutulmuştur.

---

## 3. ayeT Studios API Key nasıl alınır?

BloxGain'in "Görev yap, Coin kazan" sistemi ayeT Studios'un **offerwall**
ürününü kullanır. Kullanıcı bir görevi (uygulama indirme, anket, oyun vb.)
tamamladığında ayeT Studios'un sunucuları sizin sunucunuza bir "postback"
(bildirim) isteği gönderir; bu istek doğrulanıp Coin bakiyeye işlenir.

Adımlar:

1. **Yayıncı hesabı açın**: https://www.ayetstudios.com/ adresine gidip
   "Publishers" / "Become a Publisher" seçeneğinden bir yayıncı (publisher)
   hesabı oluşturun. Başvurunuz ayeT Studios ekibi tarafından incelenip
   onaylanır (genelde birkaç iş günü sürebilir).
2. **Yeni bir "App" / "Placement" oluşturun**: Onay sonrası panelde
   platformunuzu (web) tanımlayın. Bu adımda size bir **Offerwall ID**
   (bazı yerlerde "App ID" veya "Placement ID" de denir) verilir — bunu
   `.env` dosyanızdaki `VITE_AYET_OFFERWALL_ID` alanına yazacaksınız.
3. **Postback (S2S callback) ayarlarını yapılandırın**: Panelde
   "Postback URL" veya "S2S Callback" bölümüne gidin ve şu adresi girin:
   ```
   https://SIZIN-DOMAININIZ.com/api/v1/callback/ayet?uid={subid}&currency={payout}&transaction_id={transaction_id}&signature={signature}
   ```
   (Parametre isimleri ayeT Studios panelinizin sürümüne göre `{sub_id}`,
   `{user_id}` gibi farklı adlandırılmış olabilir — panelde "Available
   Macros / Parameters" listesine bakıp `uid` yerine kullanıcı kimliğini
   taşıyan makroyu seçin.)
4. **API/Security anahtarınızı kopyalayın**: Aynı panelde genelde
   "Security Token", "API Key" veya "Postback Secret" adıyla bir gizli
   anahtar bulunur. Bunu `.env` dosyanızdaki `AYET_API_KEY` alanına
   yapıştırın.
5. **İmza formülünü doğrulayın**: `server.ts` içindeki
   `/api/v1/callback/ayet` uç noktası, imzayı
   `SHA256(transaction_id + api_key)` formülüyle doğrular. Bu, ayeT
   Studios'ta yaygın kullanılan bir yöntemdir, fakat panelinizdeki
   "Postback Security" sayfasında tam formülü mutlaka kontrol edin
   (bazı hesap türlerinde tüm parametreler alfabetik sırayla
   birleştirilip hash'lenir). Formül farklıysa `server.ts` dosyasındaki
   ilgili satırı (yorumla işaretlenmiştir) panelinizdeki formüle göre
   güncelleyin.
6. **`.env` dosyanızı doldurup sunucuyu yeniden başlatın.** Sistem
   otomatik olarak aktif hale gelir — kodda başka hiçbir değişiklik
   gerekmez. `AYET_API_KEY` tanımlı değilken postback uç noktası
   güvenlik gereği tamamen kapalıdır (istekleri reddeder), bu yüzden
   yanlışlıkla sahte coin üretimine izin vermez.

> Not: ayeT Studios'un panel arayüzü ve terminolojisi zaman zaman
> güncellenebilir. Yukarıdaki adımlar genel akışı anlatır; kendi
> hesabınızdaki menü isimleri birebir aynı olmayabilir. Emin
> olamadığınız noktalarda ayeT Studios'un yayıncı destek ekibiyle
> iletişime geçebilirsiniz.

---

## 4. Roblox otomatik Robux ödemesi (isteğe bağlı)

Kullanıcıların Robux'unu **otomatik** olarak göndermek isterseniz bir
Roblox bot hesabının `.ROBLOSECURITY` çerezini `ROBLOX_COOKIE` alanına
girmeniz gerekir. Bu adımı siz kendiniz, kendi bot hesabınızla
gerçekleştireceksiniz; bu depo sadece altyapıyı hazırlar.

**Güvenlik uyarıları:**

- Bu çerez, o Roblox hesabının **tam kontrolünü** verir. Kimseyle
  paylaşmayın, hiçbir zaman bir repoya (public ya da private) commit
  etmeyin.
- Bot hesabında yalnızca ödemeler için gereken kadar Robux bulundurun.
- `.env` tanımlı değilken sistem otomatik olarak "Bekliyor" moduna
  düşer: kullanıcının Coin bakiyesi düşülür ve talep kaydedilir, ama
  kullanıcıya asla sahte bir "ödeme onaylandı" mesajı gösterilmez.

---

## 5. Bu sürümde düzeltilen güvenlik açıkları

Orijinal koddaki büyük sorunlar ve bu sürümde nasıl çözüldükleri:

1. **Kimlik doğrulama eksikliği** — Eskiden tüm işlemler (`/api/wheel/spin`,
   `/api/payout/request`) body'de gönderilen düz bir `username` alanına
   güveniyordu; herhangi biri başka bir kullanıcının adını yazıp onun
   bakiyesini harcayabilirdi. Artık her hassas uç nokta
   `Authorization: Bearer <JWT>` header'ını zorunlu kılıyor ve kimlik
   sadece doğrulanmış token'dan okunuyor.
2. **Sahte "görev yap, coin kazan" sistemi** — Eskiden görev kartına
   tıklanınca coin doğrudan tarayıcıda (client-side) ekleniyordu; bu,
   herkesin tarayıcı konsolundan sınırsız coin üretebileceği anlamına
   geliyordu. Artık coin **yalnızca** ayeT-Studios'un sunucudan-sunucuya
   gönderdiği postback isteğiyle, sunucu tarafında işleniyor.
3. **Postback imza doğrulamasında bypass** — Eskiden `AYET_API_KEY`
   tanımlı değilse imza kontrolü tamamen atlanıyordu. Artık anahtar
   tanımlı değilse uç nokta tüm istekleri reddediyor.
4. **Postback tekrar oynatma (replay) koruması yok** — Aynı
   `transaction_id` ile postback tekrar gönderilirse coin ikinci kez
   işlenebiliyordu. Artık işlenen her `transaction_id` kaydediliyor ve
   tekrarlar idempotent şekilde (coin eklemeden) `OK` döndürülüyor.
5. **Tehlikeli varsayılan gizli anahtarlar** — `JWT_SECRET` ve
   `AYET_API_KEY` için kodun içine gömülü sabit "fallback" değerler
   vardı. Artık `JWT_SECRET` tanımlı değilse sunucu hiç başlamıyor;
   `AYET_API_KEY` tanımlı değilse ilgili uç nokta pasif kalıyor.
6. **Bakiye yarış durumu (race condition)** — Ödeme talebinde eskiden
   "önce oku, sonra yaz" yapılıyordu; hızlı art arda istekle bakiye
   eksiye düşürülebilirdi. Artık MongoDB'de atomik
   `findOneAndUpdate` ile "yeterli bakiye varsa düş" işlemi tek adımda
   yapılıyor.
7. **Sahte Roblox ödeme onayı** — Bot çerezi tanımlı değilken kullanıcıya
   "ödemeniz onaylandı" diye yalan söyleniyordu. Artık dürüstçe
   "beklemede" durumu bildiriliyor.
8. **Rate limiting yok** — Giriş/kayıt ve ödeme uç noktaları sınırsız
   denenebiliyordu (brute-force riski). Artık IP bazlı rate limiting
   eklendi.
9. **Zayıf girdi doğrulama** — Kullanıcı adı/e-posta/şifre formatları
   sunucu tarafında da (sadece frontend'de değil) doğrulanıyor; şifre
   minimum uzunluğu 8 karaktere çıkarıldı.
10. **Timing attack riski** — Var olmayan kullanıcı adlarıyla giriş
    denemelerinde bile sabit bir "dummy" bcrypt karşılaştırması
    yapılarak yanıt süresi farkının kullanıcı adı sızdırmasının önüne
    geçildi.
11. **Kullanılmayan/gereksiz ortam değişkenleri ve kod kalıntıları
    temizlendi**: `ROBLOX_GROUP_ID` (kodda hiç kullanılmıyordu),
    `GEMINI_API_KEY`, `APP_URL`, `@google/genai` bağımlılığı ve
    `metadata.json` içindeki AI Studio'ya özgü Gemini yetkisi
    kaldırıldı. Tüm "Tanıtım Modu" / "demo" / "AI Studio Preview"
    mesajları ve sahte oyun/gamepass verileri (`sim_1`, `sim_2`,
    `987654321` gibi uydurma ID'ler) kaldırıldı.

### Devam eden sorumluluklar (bu depo bunları sizin için yapamaz)

- Sunucunuzu HTTPS ile yayınlamak (Render, Railway, Fly.io gibi
  platformlar bunu genelde otomatik sağlar).
- MongoDB Atlas'ta IP allowlist / güçlü bir veritabanı şifresi
  kullanmak.
- `ROBLOX_COOKIE`'yi düzenli olarak yenilemek (Roblox çerezleri süreli
  olabilir) ve bot hesabını izlemek.
- Anormal coin/ödeme hareketlerini (ör. çok kısa sürede çok sayıda
  görev tamamlama) izlemek; bu depo temel rate limiting sağlar ama
  gelişmiş dolandırıcılık tespiti (fraud detection) içermez.

### İkinci denetim turunda (bug/güvenlik/mobil) yapılan ek düzeltmeler

1. **Ödeme durumu bug'ı**: In-memory (MongoDB bağlı değilken) modda,
   `ROBLOX_COOKIE` tanımlı olmadığında oluşturulan "Bekliyor" durumundaki
   ödeme kayıtları yanlışlıkla "Onaylandı" olarak kaydediliyordu ve canlı
   akışta gerçekleşmemiş bir ödeme gerçekleşmiş gibi görünebiliyordu.
   Düzeltildi.
2. **Regex injection / ReDoS riski**: Giriş (login) sırasında kullanıcı
   adı, escape edilmeden MongoDB `$regex` sorgusuna veriliyordu. Artık
   tüm regex özel karakterleri escape ediliyor.
3. **JWT algoritma sabitleme**: `jwt.sign`/`jwt.verify` çağrılarına
   açıkça `HS256` algoritması belirtildi ("algorithm confusion" saldırı
   sınıfına karşı ekstra güvenlik).
4. **Eksik rate limiting**: `/api/wheel/spin`, `/api/roblox/avatar`,
   `/api/roblox/games`, `/api/auth/me` ve `/api/payout/feed` uç
   noktalarına da rate limiting eklendi (öncesinde sadece login/register
   ve ödeme uç noktalarında vardı).
5. **Temel güvenlik HTTP başlıkları** eklendi (`X-Content-Type-Options`,
   `X-Frame-Options`, `Referrer-Policy`, üretimde `Strict-Transport-Security`).
6. **Bozuk JSON body ve beklenmeyen hatalar için global hata yakalayıcı**
   eklendi; artık sunucu, ele alınmamış bir hata yüzünden çökmüyor ve
   kullanıcıya teknik detay (stack trace) sızdırmıyor.
7. **Görev tamamlama sonrası otomatik bakiye yenileme**: Kullanıcı
   ayeT-Studios görev sayfasından BloxGain sekmesine geri döndüğünde
   bakiye artık otomatik olarak sunucudan tazeleniyor (öncesinde
   kullanıcı sayfayı manuel yenilemek zorundaydı).
8. **Mobil klavye/otomatik doldurma iyileştirmeleri**: Tüm form
   alanlarına uygun `autoComplete`, `inputMode`, `autoCapitalize` ve
   `spellCheck` öznitelikleri eklendi (özellikle şifre yöneticisi
   entegrasyonu ve sayısal klavye açılması için).
9. **Erişilebilirlik düzeltmesi**: `index.html`'deki
   `user-scalable=no, maximum-scale=1.0` kaldırıldı — bu, kullanıcıların
   sayfayı yakınlaştırmasını (pinch-to-zoom) engelliyordu ve
   erişilebilirlik açısından sorunluydu. `lang="en"` → `lang="tr"`
   olarak düzeltildi.
10. **Geçersiz Tailwind rengi düzeltildi**: `bg-red-990` (Tailwind'de
    böyle bir ton yok, 950'de duruyor) kullanımı, hata bildirimlerinin
    arka planının hiç görünmemesine sebep oluyordu. `red-950` olarak
    düzeltildi.
11. **Service Worker önbellek stratejisi değiştirildi**: Eski
    "cache-first" strateji, her yeni deploy sonrası kullanıcıların eski
    JS/CSS dosyalarını görmeye devam etmesine sebep oluyordu. Artık
    "network-first, cache fallback" kullanılıyor — kullanıcılar her
    zaman güncel sürümü görür, sadece internet yokken önbelleğe düşülür.
12. **Kopya/gereksiz `public/public/` klasörü** temizlendi.
13. **Kullanılmayan kod temizliği**: Hiç kullanılmayan `payoutMethod`
    state'i kaldırıldı.
14. **Roblox lookup uç noktalarına girdi uzunluğu sınırı** eklendi (aşırı
    uzun kullanıcı adı stringleriyle dış Roblox API'sine gereksiz yük
    bindirilmesini önlemek için).

---

## 6. Proje yapısı

```
server.ts              → Express sunucusu, tüm API uç noktaları
server/db.ts            → MongoDB şemaları + in-memory fallback
server/auth.ts           → JWT doğrulama middleware'i
server/rateLimit.ts       → Basit IP bazlı rate limiter
src/App.tsx              → Kök React bileşeni, oturum doğrulama
src/AuthPage.tsx          → Giriş/Kayıt ekranı
src/DashboardPreview.tsx  → Ana panel (görevler, çark, çekim)
```
