# DEFENDUDE Game Lab

Bu klasor ana urunden bagimsiz deneysel oyun gelistirme alanidir. Silindiginde ASP.NET Core katmanlari, `ClientApp` ve ana build akisi bozulmaz.

## Bu asama

- Grid tabanli sabit dunya altyapisi kuruldu.
- Ground tile assetleri lab icine izole kopyalanir.
- Domain tarafinda Phaser bagimliligi yoktur.
- Phaser sadece render/scene katmaninda kullanilir.

## Klasorler

- `src/core`: grid ve world domain modelleri.
- `src/game`: oyuna ait tile catalog ve sabit harita verisi.
- `src/phaser`: Phaser asset loading, scene ve render adapterleri.
- `public/assets/ground_tiles`: lab'in kullandigi tile PNG kopyalari.

## Komutlar

```powershell
npm install
npm run dev
npm run build
```

## Canliya Alma Hazirligi

Cloudflare Pages icin beklenen ayarlar:

```text
Root directory: experiments/game-lab
Build command: npm run build
Build output directory: dist
```

Cloudflare Pages environment variables:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wN5V138Kyv2gZ5J1rs-8vQ_kHK30hT5
```

`VITE_SUPABASE_URL` Supabase Project Settings > API ekranindaki Project URL degeridir.
Publishable key client tarafinda kullanilabilir; service role key kesinlikle client veya repo icine konulmamalidir.

Supabase baglantisi bir sonraki entegrasyon adiminda `TrialPersistencePort` uzerinden eklenecek. Lab su anda ayni portu `localStorage` adapteri ile kullandigi icin oyun akisi Supabase'e geciste degismemeli.

## GitHub Repo

Hedef repo:

```text
https://github.com/tahabasegmez/DEFENDUDE.git
```

Ilk push icin:

```powershell
git init
git remote add origin https://github.com/tahabasegmez/DEFENDUDE.git
git add .
git commit -m "Prepare DEFENDUDE game lab"
git branch -M main
git push -u origin main
```
