# StatWeb — Web Tabanlı İstatistiksel Analiz Platformu

StatWeb, öğrenciler, akademisyenler ve araştırmacılar için tasarlanmış, **SPSS iş akışından ilham alan** web tabanlı modern bir istatistiksel analiz platformudur.

Kullanıcılara tanıdık gelen elektronik tablo görünümü (**Veri Görünümü** ve **Değişken Görünümü**), veri dönüştürme araçları, bağımsız Python istatistik motoru, etkileşimli Plotly.js grafikleri ve WeasyPrint ile akademik PDF raporlama imkanı sunar.

> 🗺️ **Proje Yol Haritası:** Tamamlanan ve önümüzdeki fazlarda eklenecek özellikleri incelemek için **[ROADMAP.md](ROADMAP.md)** belgesine göz atabilirsiniz.

---

## 🚀 Temel Özellikler

- **Veri Seti Yönetimi:**
  - SPSS (`.sav`), Excel (`.xlsx`) ve `.csv` dosyalarını içe aktarma.
  - Değişken etiketleri, değer etiketleri (*Value Labels*), kullanıcı kayıp kodları (*Missing Values*) ve ölçüm düzeylerini (*Ölçek, Nominal, Sıralı*) eksiksiz koruma.
  - Veri setini dilediğiniz zaman `.csv` veya `.xlsx` formatında dışa aktarma.
- **SPSS Tarzı Elektronik Tablo:**
  - **Veri Görünümü (Data View):** Gözlemler satırlarda, değişkenler sütunlarda. Doğrudan çift tıklayarak hücre düzenleme, yeni gözlem ekleme, sanallaştırılmış sayfalamalı hızlı tablo.
  - **Değişken Görünümü (Variable View):** Değişken adı, etiket, veri türü, ondalık basamak, genişlik, ölçüm düzeyi ve değer etiketleri yönetimi.
- **Veri Dönüştürme (Transform Menüsü):**
  - **Değişken Hesapla (Compute Variable):** Matematiksel formüller ve fonksiyonlarla (`+`, `-`, `*`, `/`, `sqrt`, `log`, `round` vb.) yeni değişkenler türetme.
  - **Değişkeni Yeniden Kodla (Recode Variable):** Değerleri tek tek veya sayısal aralıklar bazında yeniden kodlama.
  - **Değer Etiketleri Editörü (Value Labels):** Kategorik kodlara metinsel karşılıklar atama (`1 = Lisans`, `2 = Yüksek Lisans`).
- **Bağımsız İstatistik Motoru:**
  - **Betimsel İstatistikler:** Ortalama, Std. Hata, Std. Sapma, Varyans, Medyan, Çeyrekler, IQR, Min/Maks, Çarpıklık, Basıklık.
  - **Frekans Dağılımları:** Frekanslar, yüzdeler, geçerli yüzdeler, kümülatif dağılımlar.
  - **Çapraz Tablolar (Crosstabs):** Kontenjans tabloları, satır/sütun yüzdeleri, Pearson Ki-Kare testi, Cramer's V ve Phi katsayıları.
  - **Hipotez Testleri:** Bağımsız Örneklem T-Testi (Levene homojenlik testi ile) ve Eşleştirilmiş Örneklem T-Testi.
  - **Varyans Analizi (ANOVA):** Tek Yönlü ANOVA, gruplar arası/grup içi kareler toplamı, F ve p değerleri.
  - **Korelasyon Analizi:** Pearson ve Spearman sıra korelasyon matrisi (iki yönlü anlamlılık ile).
  - **Doğrusal Regresyon:** En Küçük Kareler (OLS) regresyonu, Model Özeti ($R, R^2, Adj-R^2$), ANOVA tablosu, Katsayılar ($B, Beta, t, p, CI$) ve VIF/Tolerans çoklu bağlantı tanıları.
- **Görselleştirme ve Raporlama:**
  - Plotly.js ile dinamik, etkileşimli grafikler.
  - WeasyPrint tabanlı, Türkçe akademik formatta tek tıkla indirilebilir PDF raporları.

---

## 🛠️ Teknoloji Yığını

### Ön Yüz (Frontend)
- **React 18 + TypeScript** + **Vite**
- **ReactGrid** (Sanallaştırılmış elektronik tablo bileşeni)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query (React Query)** (Sunucu durumu önbellekleme)
- **Zustand** (İstemci UI durumu)
- **Plotly.js** (İstatistiksel grafikler)
- **React Hook Form + Zod** (Form doğrulama)

### Arka Yüz ve İstatistik Motoru (Backend)
- **Python 3.14+** + **FastAPI** + **Pydantic v2**
- **SciPy & statsmodels** (İstatistiksel test motoru — framework bağımsız saf Python modülü)
- **pandas, NumPy, pyreadstat, openpyxl** (Veri işleme ve SPSS `.sav` okuma)
- **WeasyPrint** (HTML/CSS şablonlarından PDF rapor derleme)
- **SQLAlchemy 2.0 + Alembic** (İlişkisel veritabanı ve migrasyonlar)

### Veritabanı ve Depolama
- **PostgreSQL 16** (Yalnızca meta veriler, projeler, analiz geçmişi; veri gözlemleri veritabanı tablolarına yüklenmez)
- **Yerel Depolama Soyutlaması (`StorageBackend`)** (Yüksek performanslı Apache Parquet dosyaları)

---

## 📦 Kurulum ve Çalıştırma

### 1. Gereksinimler
- Python 3.11+
- Node.js 18+ ve npm
- PostgreSQL veya Docker/Podman
- Sistem Kütüphaneleri (WeasyPrint için): `cairo`, `pango`

### 2. Veritabanını Başlatma (Docker / Podman)
```bash
podman run -d --name statweb-postgres \
  -e POSTGRES_USER=statweb \
  -e POSTGRES_PASSWORD=statweb_pass \
  -e POSTGRES_DB=statweb \
  -p 5432:5432 \
  docker.io/library/postgres:16
```

### 3. Backend Kurulumu
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .

# Veritabanı migrasyonlarını uygulayın
alembic upgrade head

# Backend sunucusunu başlatın
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Dokümantasyonu: `http://localhost:8000/docs`

### 4. Frontend Kurulumu
```bash
cd frontend
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```
Uygulama arayüzü: `http://localhost:5173`

### 5. Testleri Çalıştırma
```bash
# Backend testleri (İzole test veritabanı ile)
PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/

# Frontend tip ve derleme denetimi
cd frontend
npx tsc --noEmit && npm run build
```

---

## 📄 Lisans
Bu proje MIT lisansı ile lisanslanmıştır.
