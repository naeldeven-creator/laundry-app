# Panduan Hosting Gratis CleanFlow (Vercel & Supabase)

Ikuti langkah-langkah di bawah ini untuk meng-hosting proyek **CleanFlow (Pencatatan Laundry)** Anda secara **100% gratis** menggunakan **Supabase** (Database & Auth) dan **Vercel** (Frontend & API).

---

## Langkah 1: Setup Database & Autentikasi di Supabase (Gratis)

1. Kunjungi **[supabase.com](https://supabase.com)** dan daftar/masuk dengan akun GitHub atau Email Anda.
2. Di Dashboard Supabase, klik **New Project** (Proyek Baru).
3. Isi informasi proyek:
   - **Name**: `cleanflow-laundry` (atau nama pilihan Anda)
   - **Database Password**: Buat kata sandi yang aman (simpan kata sandi ini!).
   - **Region**: Pilih region terdekat (misalnya: *Singapore* untuk performa terbaik di Indonesia).
   - **Pricing Plan**: Pilih **Free Tier** (Gratis).
4. Klik **Create New Project** dan tunggu sekitar 1-2 menit hingga database selesai di-setup.
5. Setelah proyek siap, buka menu **SQL Editor** di sidebar sebelah kiri (ikon Lembaran dengan simbol SQL).
6. Klik **New Query** dan buat editor baru.
7. Salin seluruh isi kode SQL dari berkas **`supabase_schema.sql`** yang ada di proyek Anda, lalu tempel (*paste*) ke SQL Editor Supabase.
8. Klik tombol **Run** di kanan bawah. Anda akan melihat pesan bahwa query sukses dijalankan. Ini akan membuat tabel `transactions` beserta kebijakan keamanan Row Level Security (RLS) dan trigger otomatis.
9. Buka menu **Project Settings** (ikon Gigi di kiri bawah) > **API**.
10. Salin dua nilai berikut untuk dimasukkan ke konfigurasi aplikasi:
    - **Project URL** (Ganti `NEXT_PUBLIC_SUPABASE_URL` Anda dengan ini).
    - **anon public API Key** (Ganti `NEXT_PUBLIC_SUPABASE_ANON_KEY` Anda dengan ini).

---

## Langkah 2: Uji Coba & Konfigurasi Lokal

1. Buka berkas **`.env.local`** di proyek Anda menggunakan VS Code atau teks editor lainnya.
2. Masukkan URL dan Anon Key asli Anda yang telah disalin dari Supabase pada Langkah 1:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
   ```
3. Buka terminal di folder proyek Anda dan jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka browser di **`http://localhost:3000`** untuk menguji pendaftaran akun baru, login, dan pencatatan transaksi laundry secara lokal.

---

## Langkah 3: Unggah Proyek ke GitHub (Gratis)

Vercel akan melakukan deployment otomatis setiap kali Anda memperbarui kode di GitHub.

1. Buka akun **[github.com](https://github.com)** Anda dan buat repositori baru (klik tombol **New**).
   - Beri nama repositori, misalnya: `laundry-app`.
   - Pilih visibilitas **Private** (Sangat disarankan agar `.env.local` atau kunci sensitif Anda tidak terlihat publik, meskipun Supabase Anon Key aman dipublikasikan).
   - Jangan centang "Add a README", ".gitignore", atau "License".
2. Buka terminal di folder proyek Anda (`C:\Users\naeld\.gemini\antigravity\scratch\laundry-app`) dan hubungkan folder lokal ke repositori GitHub:
   ```bash
   git init
   git add .
   git commit -m "inisialisasi proyek laundry"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/laundry-app.git
   git push -u origin main
   ```
   *(Ganti `USERNAME-ANDA` dengan nama pengguna GitHub Anda sendiri).*

---

## Langkah 4: Hosting Aplikasi di Vercel (Gratis)

1. Buka **[vercel.com](https://vercel.com)** dan masuk menggunakan akun GitHub Anda.
2. Di Dashboard Vercel, klik tombol **Add New...** > **Project**.
3. Vercel akan menampilkan daftar repositori GitHub Anda. Cari repositori `laundry-app` yang baru saja diunggah, lalu klik **Import**.
4. Di halaman konfigurasi Vercel:
   - **Framework Preset**: Pilih **Next.js** (biasanya terdeteksi otomatis).
   - **Root Directory**: Biarkan default `./`.
5. Buka bagian **Environment Variables** (Variabel Lingkungan) dan tambahkan dua variabel berikut:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Value**: *(Isi dengan URL Supabase Anda)*
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Value**: *(Isi dengan Anon Key Supabase Anda)*
   *(Klik **Add** setelah memasukkan masing-masing variabel).*
6. Klik tombol **Deploy**.
7. Tunggu proses build selesai (sekitar 1 menit). Setelah selesai, Vercel akan menampilkan halaman sukses beserta link situs web gratis Anda (misalnya: `https://laundry-app.vercel.app`).

**Selamat! Web Pencatatan Laundry Anda sekarang aktif dan dapat diakses dari mana saja secara online dan gratis!** 🎉
