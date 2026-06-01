import "./globals.css";

export const metadata = {
  title: "CleanFlow - Sistem Pencatatan Laundry Modern",
  description: "Kelola dan catat transaksi laundry Anda dengan mudah. Pelacakan status pencucian, laporan keuangan, dan manajemen pelanggan yang modern dan responsif.",
  keywords: "laundry, pencatatan laundry, kasir laundry, aplikasi laundry gratis, cleanflow",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
