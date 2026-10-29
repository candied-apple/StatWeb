# StatWeb — Yol Haritası ve Geliştirme Planı (Roadmap)

Bu belge, **StatWeb** platformunda şu ana kadar tamamlanan özellikleri, mevcut durumu ve önümüzdeki fazlarda geliştirilmeye devam edilecek tüm kabiliyetleri detaylandırmaktadır.

---

## 📊 Genel Durum Özeti

| Faz | Kapsam | Durum |
| :--- | :--- | :--- |
| **Faz 1: Çekirdek MVP & Temel İstatistikler** | SPSS arayüzü, Veri/Değişken görünümü, 7 temel analiz, WeasyPrint PDF, Çift dil (TR/EN) | ✅ **Tamamlandı** |
| **Faz 2: İleri İstatistiksel Analizler** | Post-Hoc, Çok Yönlü ANOVA, Non-Parametrik Testler, Cronbach's Alpha, Lojistik Regresyon | 🔄 **Sırada** |
| **Faz 3: Gelişmiş Veri Yönetimi & Düzenleme** | Sıralama, Filtreleme/Select Cases, Split File, Veri Birleştirme (Merge), Kayıp Veri İkamesi | 📋 **Planlandı** |
| **Faz 4: Raporlama ve Görselleştirme Genişletmesi** | Grafik özelleştirme paneli, Word/Excel dışa aktarma, Toplu PDF rapor oluşturucu | 📋 **Planlandı** |
| **Faz 5: Kurumsal Altyapı & İşbirliği** | JWT Kimlik Doğrulama, Rol Tabanlı Erişim, S3/MinIO Depolama, SPSS Syntax Konsolu | 📋 **Planlandı** |

---

## ✅ 1. Tamamlanan Özellikler (Mevcut Sürüm - v0.1.0)

### A. Veri ve Dosya Yönetimi
- [x] **SPSS `.sav` İçe Aktarma:** `pyreadstat` ile değişken etiketleri (*Variable Labels*), değer etiketleri (*Value Labels*), kullanıcı kayıp kodları (*Missing Values*) ve ölçüm düzeylerini (*Ölçek, Nominal, Sıralı*) eksiksiz koruyarak içe aktarma.
- [x] **Excel (`.xlsx`) ve CSV İçe Aktarma:** Otomatik sütun ve veri türü tespiti.
- [x] **Veri Dışa Aktarma:** Veri setlerini `.csv` ve `.xlsx` formatında dışarı aktarma.
- [x] **Çoklu Proje ve Veri Seti Yönetimi:** Proje oluşturma, silme, projeler arası geçiş ve veri seti silme.
- [x] **Depolama Soyutlaması (`StorageBackend`):** Yüksek performanslı Apache Parquet dosya dönüşümü; gözlemler PostgreSQL yerine dosya katmanında tutulur.

### B. SPSS Tarzı Elektronik Tablo (Spreadsheet)
- [x] **Veri Görünümü (Data View):**
  - Gözlemler satırlarda, değişkenler sütunlarda.
  - `@silevis/reactgrid` tabanlı hücre düzenleme (çift tıklama ile doğrudan güncelleme).
  - Yeni satır (gözlem) ekleme, yeni sütun (değişken) ekleme.
  - Sayfalanmış veri gezinimi.
- [x] **Değişken Görünümü (Variable View):**
  - Değişken Adı (`Name`), Etiket (`Label`), Veri Türü (`Type`), Ondalık Basamak (`Decimals`), Genişlik (`Width`).
  - Ölçüm Düzeyi (`Measurement Level`: Ölçek / Sıralı / Nominal).
  - Değişken Rolü (`Role`: Girdi / Hedef / Her İkisi / Hiçbiri).
  - Değer Etiketleri Modalı (`Value Labels` — örn. `1 = Erkek`, `2 = Kadın`).
  - Değişken silme ve güncelleme.

### C. Veri Dönüştürme Araçları (Transform Menüsü)
- [x] **Değişken Hesapla (Compute Variable):** Matematiksel formüllerle (`+`, `-`, `*`, `/`, `sqrt`, `log`, `round`, `abs` vb.) yeni değişken türetme.
- [x] **Yeniden Kodla (Recode Variable):** Mevcut değerleri tek tek veya sayısal aralıklar (*Range*) bazında yeni kodlara dönüştürme.

### D. Bağımsız İstatistik Motoru (SciPy & statsmodels)
Framework bağımsız, saf Python motoru ile 7 temel analiz kategorisi:
- [x] **Betimsel İstatistikler (Descriptives):** Ortalama, Std. Hata, Std. Sapma, Varyans, Medyan, Çeyrekler, IQR, Min/Maks, Çarpıklık (*Skewness*), Basıklık (*Kurtosis*).
- [x] **Frekans Dağılımları (Frequencies):** Frekans, yüzde, geçerli yüzde, kümülatif yüzde tabloları ve çubuk grafikler.
- [x] **Çapraz Tablolar (Crosstabs):** Kontenjans tablosu, Pearson Ki-Kare testi, Phi ve Cramer's V etki büyüklükleri.
- [x] **Bağımsız Örneklem T-Testi (Independent Samples T-Test):** Levene varyans homojenliği testi, eşit varyans varsayılan/varsayılmayan t, serbestlik derecesi, p-değeri, ortalama farkı, %95 güven aralığı, Cohen's d etki büyüklüğü.
- [x] **Eşleştirilmiş Örneklem T-Testi (Paired Samples T-Test):** Çift değişken fark testi, t, df, p ve güven aralıkları.
- [x] **Tek Yönlü ANOVA (One-Way ANOVA):** Gruplar arası/grup içi kareler toplamı, kareler ortalaması, F ve p-değeri.
- [x] **Korelasyon Analizi (Bivariate Correlation):** Pearson ve Spearman korelasyon matrisi, 2 yönlü p-değeri, N sayısı.
- [x] **Doğrusal Regresyon (Linear Regression):** OLS regresyonu, Model Özeti ($R, R^2, \text{Düzeltilmiş } R^2$), ANOVA tablosu, Katsayılar ($B, Beta, t, p, CI$) ve VIF / Tolerans çoklu bağlantı tanıları.

### E. Görselleştirme, Raporlama ve Çoklu Dil
- [x] **Plotly.js Etkileşimli Grafikler:** Histogram, Çubuk Grafik, Kutu Grafiği (*Box Plot*), Saçılım Grafiği (*Scatter Plot*).
- [x] **WeasyPrint Akademik PDF Raporları:** Tek tıkla indirilebilir, standart akademik formatta stilize PDF raporları.
- [x] **Tam Çift Dilli Yerelleştirme (i18n):** Türkçe (Varsayılan) ve İngilizce arasında canlı geçiş; arayüz, menüler, diyaloglar, sonuç tabloları ve oluşturulan PDF raporları iki dilde tam uyumlu.
- [x] **İzole Test Mimarisi:** Testler `statweb_test` veritabanında çalışır, geliştirme veritabanını kirletmez.

---

## 📌 2. Sırada Olan ve Geliştirilecek Özellikler

### 🎯 FAZ 2: İleri İstatistiksel Analizler (Advanced Statistics)
SPSS'te en sık kullanılan ileri düzey analizlerin eklenmesi:

1. **ANOVA Genişletmesi & Post-Hoc Testleri:**
   - [ ] **Post-Hoc Çoklu Karşılaştırma Testleri:** Tukey HSD, Bonferroni, Scheffe, Dunnett ve Games-Howell (varyanslar eşit olmadığında).
   - [ ] **İki Yönlü Faktöriyel ANOVA (Two-Way ANOVA):** Ana etkiler ve etkileşim (*interaction*) etkileri.
   - [ ] **Tekrarlı Ölçümler ANOVA (Repeated Measures ANOVA):** Denek içi faktörler ve küresellik (*sphericity - Mauchly*) testleri.

2. **Parametrik Olmayan Testler (Non-Parametric Tests):**
   - [ ] **Mann-Whitney U Testi:** Bağımsız iki grup karşılaştırması (Normal dağılmayan veriler için).
   - [ ] **Wilcoxon İşaretli Sıralar Testi (Wilcoxon Signed-Rank):** İlişkili iki ölçüm karşılaştırması.
   - [ ] **Kruskal-Wallis H Testi:** İkiden fazla bağımsız grup karşılaştırması (Tek yönlü ANOVA alternatifi).
   - [ ] **Friedman Testi:** İkiden fazla ilişkili ölçüm karşılaştırması.

3. **Ölçek Güvenilirlik Analizi (Reliability Analysis):**
   - [ ] **Cronbach's Alpha ($\alpha$):** Madde toplam korelasyonları (*Item-Total Correlation*), Madde silindiğinde alfa değeri (*Alpha if item deleted*).
   - [ ] **Madde İstatistikleri:** Ortalama, varyans, kovaryans matrisi.

4. **Kategorik Bağımlı Değişken Modelleri:**
   - [ ] **İkili Lojistik Regresyon (Binary Logistic Regression):** Odds Oranları ($\text{Exp}(B)$), Hosmer-Lemeshow uyum iyiliği, Sınıflandırma tablosu (*Classification Table*), ROC Eğrisi ve AUC.
   - [ ] **Çok Kategorili Lojistik Regresyon (Multinomial Logistic Regression).**

5. **Açımlayıcı Faktör Analizi (Exploratory Factor Analysis - EFA):**
   - [ ] **Temel Bileşenler Analizi (PCA) ve Temel Eksen Faktörleşmesi:**
   - [ ] **KMO ve Bartlett Küresellik Testi:** Örneklem uygunluk ölçütleri.
   - [ ] **Döndürme Yöntemleri (Factor Rotation):** Varimax (dik), Promax / Direct Oblimin (eğik).
   - [ ] **Özdeğerler ve Yamaç Grafiği (*Scree Plot*).**

---

### 🛠️ FAZ 3: Gelişmiş Veri Düzenleme & Veri Yönetimi (Data Wrangling)
Büyük veri setlerini işleme ve veri hazırlama araçları:

1. **Gözlem Sıralama ve Filtreleme:**
   - [ ] **Gözlemleri Sırala (Sort Cases):** Bir veya birden fazla değişkene göre artan/azalan sıralama.
   - [ ] **Gözlemleri Seç / Filtrele (Select Cases / Filter):** Mantıksal koşullara göre (`yaş >= 18 and cinsiyet == 1`) alt veri seti seçme veya filtre uygulama.
   - [ ] **Dosyayı Böl (Split File):** Gruplara göre analizleri ayrı ayrı çalıştırma (örn. analizleri kadın ve erkek için ayrı tablolar halinde sunma).

2. **Veri Seti Birleştirme (Merge Files):**
   - [ ] **Gözlem Ekle (Add Cases / Union):** Aynı değişken yapısına sahip iki veri setinin satırlarını alt alta birleştirme.
   - [ ] **Değişken Ekle (Add Variables / Join):** Ortak bir anahtar değişken (ID) üzerinden iki veri setini yan yana birleştirme (Left/Inner Join).

3. **Kayıp Değer Analizi ve İkame (Missing Value Imputation):**
   - [ ] Kayıp veri desenlerinin görselleştirilmesi (*Missing Value Patterns*).
   - [ ] Seri ortalaması (*Series Mean*), Medyan veya Doğrusal İnterpolasyon ile kayıp değer doldurma.

4. **Büyük Veri & Grid Optimizasyonu:**
   - [ ] On binlerce satır içeren büyük veri setleri için sunucu taraflı sanallaştırılmış sonsuz kaydırma (*virtualized infinite scrolling*).

---

### 📈 FAZ 4: Raporlama ve Görselleştirme Geliştirmeleri

1. **Grafik Özelleştirme Paneli:**
   - [ ] Grafik başlığı, eksen etiketleri, yazı boyutları ve renk paleti seçimi.
   - [ ] Grafikleri yüksek çözünürlüklü PNG, SVG ve EPS formatında indirme.

2. **Çoklu Dışa Aktarma Formatları:**
   - [ ] Analiz tablolarını doğrudan Microsoft Word (`.docx`) formatına akademik APA 7 standartlarında aktarma.
   - [ ] Analiz sonuçlarını formülleriyle Microsoft Excel (`.xlsx`) olarak dışa aktarma.

3. **Araştırma Raporu Birleştirici (Batch Report Builder):**
   - [ ] Bir projede yapılan birden fazla analizi (örn. Betimsel + T-Testi + Regresyon) sıraya dizerek tek bir kapsamlı PDF tez/makale raporu halinde derleme.

---

### 🏢 FAZ 5: Kurumsal Altyapı, Güvenlik ve Gelişmiş Özellikler

1. **Kullanıcı Yönetimi ve Yetkilendirme:**
   - [ ] JWT tabanlı kullanıcı oturumu (Kayıt Ol, Giriş Yap, Şifremi Unuttum).
   - [ ] Proje paylaşımı: Bir projeyi diğer araştırmacılarla salt okunur (*Viewer*) veya düzenleyici (*Editor*) rolüyle paylaşma.

2. **Nesne Depolama (S3 / MinIO):**
   - [ ] `StorageBackend` soyutlaması üzerinden AWS S3 veya MinIO uyumlu bulut depolama desteği.

3. **Sözdizimi / Komut Konsolu (Syntax Console):**
   - [ ] SPSS Syntax veya Python betiği çalıştırabilen komut satırı arayüzü; yapılan her menü işleminin syntax karşılığını görebilme (*Paste Syntax* özelliği).

---

## 💡 Yeni Özellik İstekleri ve Önceliklendirme
Öncelik verilmesini istediğiniz modülleri veya analiz türlerini ileterek geliştirme sırasını dilediğiniz gibi yönlendirebilirsiniz.
