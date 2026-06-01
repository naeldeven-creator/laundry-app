'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Redirect jika user sudah login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Email atau Password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <svg style={styles.logo} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 style={styles.title}>CleanFlow</h1>
          <p style={styles.subtitle}>Sistem Pencatatan Laundry Modern</p>
        </div>

        <h2 style={styles.sectionTitle}>Masuk Ke Aplikasi</h2>

        {error && (
          <div style={{ ...styles.alert, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div className="form-group">
            <label className="form-label">Alamat Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', height: '48px' }}
            disabled={loading}
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p style={styles.footerText}>
          Belum punya akun?{' '}
          <Link href="/register" style={styles.link}>
            Daftar sekarang
          </Link>
        </p>

        {/* Demo Credentials Box */}
        <div style={styles.demoBox}>
          <span style={styles.demoTitle}>💡 Catatan Setup:</span>
          <p style={styles.demoText}>
            Daftar akun baru terlebih dahulu, atau buat project di Supabase dan jalankan script SQL yang ada di berkas <code>supabase_schema.sql</code>.
          </p>
        </div>
      </div>
    </main>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem 1rem',
    background: 'var(--bg-gradient)',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '2.5rem',
    animation: 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    background: 'rgba(197, 168, 92, 0.15)',
    border: '1px solid rgba(197, 168, 92, 0.3)',
    marginBottom: '1rem',
    boxShadow: '0 0 20px rgba(197, 168, 92, 0.2)',
  },
  logo: {
    width: '32px',
    height: '32px',
    color: 'var(--primary)',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, var(--primary), var(--text-primary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '0.02em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '0.25rem',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  alert: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    border: '1px solid',
    marginBottom: '1.5rem',
    lineHeight: '1.4',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '1.5rem',
  },
  link: {
    color: 'var(--primary)',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color var(--transition-fast)',
  },
  demoBox: {
    marginTop: '2rem',
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(197, 168, 92, 0.05)',
    border: '1px solid rgba(197, 168, 92, 0.15)',
  },
  demoTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: '0.25rem',
  },
  demoText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
};
