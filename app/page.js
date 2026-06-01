'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    ready: 0,
    earnings: 0,
    total: 0
  });

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form / Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Input Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [weight, setWeight] = useState(1);
  const [serviceType, setServiceType] = useState('Regular');
  const [pricePerKg, setPricePerKg] = useState(7000);
  const [status, setStatus] = useState('queued');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [notes, setNotes] = useState('');

  const router = useRouter();

  // 1. Cek Autentikasi saat load
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        router.push('/login');
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);
      setLoading(false);
    };

    checkAuth();

    // Subscribe ke perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sessionState) => {
      if (!sessionState) {
        router.push('/login');
      } else {
        setSession(sessionState);
        setUser(sessionState.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // 2. Fetch transaksi dari API
  const fetchTransactions = async () => {
    if (!session) return;

    try {
      const token = session.access_token;
      let url = `/api/transactions?status=${statusFilter}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();

      if (res.ok) {
        setTransactions(result.data || []);
        calculateStats(result.data || []);
      } else {
        showToast(result.error || 'Gagal mengambil data', 'error');
      }
    } catch (err) {
      showToast('Koneksi internet bermasalah', 'error');
    }
  };

  // Re-fetch saat filter atau pencarian berubah
  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session, statusFilter, searchQuery]);

  // 3. Hitung Statistik Dashboard
  const calculateStats = (data) => {
    const active = data.filter(t => ['queued', 'washing', 'drying'].includes(t.status)).length;
    const ready = data.filter(t => t.status === 'ready').length;
    const earnings = data
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.total_price), 0);
    const total = data.length;

    setStats({ active, ready, earnings, total });
  };

  // 4. Toast Notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  // 5. Reset input form
  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setWeight(1);
    setServiceType('Regular');
    setPricePerKg(7000);
    setStatus('queued');
    setPaymentStatus('unpaid');
    setNotes('');
    setIsEdit(false);
    setEditingId(null);
  };

  // 6. Handle Simpan (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || weight <= 0 || pricePerKg <= 0) {
      showToast('Mohon lengkapi data dengan benar.', 'error');
      return;
    }

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      weight: Number(weight),
      service_type: serviceType,
      price_per_kg: Number(pricePerKg),
      status,
      payment_status: paymentStatus,
      notes
    };

    try {
      const token = session.access_token;
      let url = '/api/transactions';
      let method = 'POST';

      if (isEdit) {
        url = `/api/transactions/${editingId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        showToast(isEdit ? 'Transaksi berhasil diperbarui!' : 'Transaksi baru berhasil dicatat!');
        setShowModal(false);
        resetForm();
        fetchTransactions();
      } else {
        showToast(result.error || 'Terjadi kesalahan', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung dengan server', 'error');
    }
  };

  // 7. Klik tombol Edit
  const handleEditClick = (tx) => {
    setIsEdit(true);
    setEditingId(tx.id);
    setCustomerName(tx.customer_name);
    setCustomerPhone(tx.customer_phone || '');
    setWeight(tx.weight);
    setServiceType(tx.service_type);
    setPricePerKg(tx.price_per_kg);
    setStatus(tx.status);
    setPaymentStatus(tx.payment_status);
    setNotes(tx.notes || '');
    setShowModal(true);
  };

  // 8. Cepat update status langsung dari tabel
  const handleStatusChange = async (txId, newStatus) => {
    try {
      const token = session.access_token;
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await res.json();
      if (res.ok) {
        showToast('Status berhasil diubah!');
        fetchTransactions();
      } else {
        showToast(result.error || 'Gagal mengubah status', 'error');
      }
    } catch (err) {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  // 9. Cepat update pembayaran langsung dari tabel
  const togglePaymentStatus = async (tx) => {
    const newPayment = tx.payment_status === 'paid' ? 'unpaid' : 'paid';
    try {
      const token = session.access_token;
      const res = await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_status: newPayment })
      });

      const result = await res.json();
      if (res.ok) {
        showToast(`Pembayaran ditandai sebagai ${newPayment === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}`);
        fetchTransactions();
      } else {
        showToast(result.error || 'Gagal mengubah status bayar', 'error');
      }
    } catch (err) {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  // 10. Hapus Transaksi
  const handleDelete = async (txId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) return;

    try {
      const token = session.access_token;
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await res.json();
      if (res.ok) {
        showToast('Transaksi berhasil dihapus');
        fetchTransactions();
      } else {
        showToast(result.error || 'Gagal menghapus transaksi', 'error');
      }
    } catch (err) {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  // 11. Keluar Akun
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Format Rupiah
  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Memuat aplikasi...</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardLayout}>
      {/* Sidebar */}
      <aside className="glass-panel" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogoBox}>
            <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 style={styles.sidebarTitle}>CleanFlow</h1>
            <span style={styles.sidebarSubtitle}>Laundry App</span>
          </div>
        </div>

        <nav style={styles.sidebarNav}>
          <div style={{ ...styles.navItem, ...styles.navItemActive }}>
            <svg style={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </div>
        </nav>

        <div style={styles.sidebarUser}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              <span style={styles.userLabel}>Log Masuk Sebagai:</span>
              <p style={styles.userEmail} title={user?.email}>{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.mainArea}>
        {/* Header */}
        <header style={styles.mainHeader}>
          <div>
            <h2 style={styles.welcomeTitle}>Halo, {user?.user_metadata?.full_name || 'Admin Laundry'}!</h2>
            <p style={styles.welcomeSubtitle}>Berikut ringkasan operasional dan pencatatan laundry hari ini.</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Transaksi
          </button>
        </header>

        {/* Stats Grid */}
        <section style={styles.statsGrid}>
          <div className="glass-panel glass-card-hover" style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: 'rgba(245, 158, 11, 0.15)' }}>
              <svg style={{ width: '24px', height: '24px', color: '#fbbf24' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span style={styles.statLabel}>Cucian Aktif (Proses)</span>
              <p style={styles.statValue}>{stats.active}</p>
            </div>
          </div>

          <div className="glass-panel glass-card-hover" style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: 'rgba(16, 185, 129, 0.15)' }}>
              <svg style={{ width: '24px', height: '24px', color: '#34d399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span style={styles.statLabel}>Selesai & Siap Diambil</span>
              <p style={styles.statValue}>{stats.ready}</p>
            </div>
          </div>

          <div className="glass-panel glass-card-hover" style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: 'rgba(147, 51, 234, 0.15)' }}>
              <svg style={{ width: '24px', height: '24px', color: '#c084fc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span style={styles.statLabel}>Total Pendapatan (Lunas)</span>
              <p style={{ ...styles.statValue, color: '#34d399' }}>{formatRupiah(stats.earnings)}</p>
            </div>
          </div>

          <div className="glass-panel glass-card-hover" style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: 'rgba(59, 130, 246, 0.15)' }}>
              <svg style={{ width: '24px', height: '24px', color: '#60a5fa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <span style={styles.statLabel}>Total Transaksi</span>
              <p style={styles.statValue}>{stats.total}</p>
            </div>
          </div>
        </section>

        {/* Data Filter & Table */}
        <section className="glass-panel" style={styles.tableCard}>
          <div style={styles.tableToolbar}>
            <div style={styles.searchBox}>
              <svg style={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama pelanggan..."
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">Semua Status</option>
                <option value="queued">Antrean</option>
                <option value="washing">Cuci</option>
                <option value="drying">Pengering</option>
                <option value="ready">Selesai</option>
                <option value="taken">Diambil</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            {transactions.length === 0 ? (
              <div style={styles.emptyState}>
                <svg style={{ width: '48px', height: '48px', color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586-3.586a2 2 0 00-2.828 0L12 14m-8 0l3.586-3.586a2 2 0 002.828 0L14 14m-4-6h.01M6 20h12a2 2 0 002-2v-3a2 2 0 00-2-2H6a2 2 0 00-2 2v3a2 2 0 002 2z" />
                </svg>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Tidak ada transaksi laundry ditemukan.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Detail Layanan</th>
                    <th>Berat (kg)</th>
                    <th>Total Biaya</th>
                    <th>Status Pembayaran</th>
                    <th>Status Laundry</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span style={styles.txCustName}>{tx.customer_name}</span>
                        <span style={styles.txCustPhone}>{tx.customer_phone || '-'}</span>
                      </td>
                      <td>
                        <span style={styles.txService}>{tx.service_type}</span>
                        <span style={styles.txNotes} title={tx.notes}>{tx.notes || '-'}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{tx.weight} kg</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>{formatRupiah(tx.total_price)}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => togglePaymentStatus(tx)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none' }}
                          title="Klik untuk mengubah status pembayaran"
                        >
                          <span className={`badge ${tx.payment_status === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                            {tx.payment_status === 'paid' ? 'Lunas' : 'Belum Bayar'}
                          </span>
                        </button>
                      </td>
                      <td>
                        <select
                          value={tx.status}
                          onChange={(e) => handleStatusChange(tx.id, e.target.value)}
                          style={{
                            ...styles.tableSelect,
                            color: getStatusColor(tx.status),
                            borderColor: getStatusColor(tx.status)
                          }}
                        >
                          <option value="queued">Antrean</option>
                          <option value="washing">Cuci</option>
                          <option value="drying">Pengering</option>
                          <option value="ready">Selesai</option>
                          <option value="taken">Diambil</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={styles.actionsContainer}>
                          <button
                            onClick={() => handleEditClick(tx)}
                            style={styles.actionBtn}
                            title="Edit Transaksi"
                          >
                            <svg style={{ width: '16px', height: '16px', color: '#60a5fa' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            style={styles.actionBtn}
                            title="Hapus Transaksi"
                          >
                            <svg style={{ width: '16px', height: '16px', color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Modal Form Tambah/Edit */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{isEdit ? 'Ubah Catatan Laundry' : 'Catat Laundry Baru'}</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={styles.modalCloseBtn}>
                <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nama Pelanggan *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Masukkan nama pelanggan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Nomor Telepon/WA</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="081xxxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Berat Pakaian (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="form-input"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Harga Per Kg (IDR) *</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    className="form-input"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jenis Layanan</label>
                  <select
                    className="form-input"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="Regular">Regular (2-3 Hari)</option>
                    <option value="Express">Express (1 Hari)</option>
                    <option value="Super Express">Super Express (6 Jam)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status Pembayaran</label>
                  <select
                    className="form-input"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                  >
                    <option value="unpaid">Belum Bayar</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>

                {isEdit && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Status Laundry</label>
                    <select
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="queued">Antrean (Queued)</option>
                      <option value="washing">Pencucian (Washing)</option>
                      <option value="drying">Pengeringan (Drying)</option>
                      <option value="ready">Selesai (Ready)</option>
                      <option value="taken">Diambil (Taken)</option>
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Catatan Tambahan</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="Contoh: baju putih dipisah, parfum melati..."
                    style={{ resize: 'vertical' }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {/* Live Price Calculator */}
              <div style={styles.liveCalculation}>
                <span>Estimasi Total Pembayaran:</span>
                <strong style={{ color: '#10b981', fontSize: '1.25rem' }}>
                  {formatRupiah(Number(weight) * Number(pricePerKg))}
                </strong>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`notification ${toast.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Helper warna status
function getStatusColor(status) {
  switch (status) {
    case 'queued': return '#a08133';
    case 'washing': return '#1d4ed8';
    case 'drying': return '#6d28d9';
    case 'ready': return '#047857';
    case 'taken': return '#374151';
    default: return 'var(--text-primary)';
  }
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--bg-gradient)'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(197, 168, 92, 0.1)',
    borderTopColor: 'var(--primary)',
    borderRadius: '50%',
    animation: 'pulseGlow 1.5s infinite linear',
  },
  dashboardLayout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    background: 'var(--bg-gradient)',
  },
  sidebar: {
    width: 'var(--sidebar-width)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    borderRadius: '0',
    borderRight: '1px solid var(--card-border)',
    borderTop: '0',
    borderBottom: '0',
    borderLeft: '0',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '2.5rem',
  },
  sidebarLogoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px var(--primary-glow)',
  },
  sidebarTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '0.01em',
  },
  sidebarSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: '-2px',
  },
  sidebarNav: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  navItemActive: {
    background: 'rgba(197, 168, 92, 0.12)',
    color: 'var(--primary)',
    border: '1px solid rgba(197, 168, 92, 0.25)',
  },
  navIcon: {
    width: '20px',
    height: '20px',
  },
  sidebarUser: {
    borderTop: '1px solid rgba(197, 168, 92, 0.15)',
    paddingTop: '1.5rem',
    marginTop: 'auto',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(197, 168, 92, 0.08)',
    border: '1px solid rgba(197, 168, 92, 0.25)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  userLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'block',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  mainArea: {
    flex: '1',
    marginLeft: 'var(--sidebar-width)',
    padding: '2.5rem',
    maxWidth: 'calc(100vw - var(--sidebar-width))',
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  welcomeTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  welcomeSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    marginTop: '0.25rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    padding: '1.5rem',
  },
  statIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    display: 'block',
  },
  statValue: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--text-primary)',
    marginTop: '0.25rem',
  },
  tableCard: {
    padding: '2rem',
    marginBottom: '2rem',
  },
  tableToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  searchBox: {
    position: 'relative',
    flex: '1',
    maxWidth: '400px',
    minWidth: '250px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '0.65rem 1rem 0.65rem 2.5rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.9rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  filterLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  filterSelect: {
    padding: '0.65rem 1.5rem 0.65rem 1rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  txCustName: {
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'block',
  },
  txCustPhone: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: '2px',
  },
  txService: {
    fontWeight: '500',
    color: 'var(--text-primary)',
    display: 'block',
  },
  txNotes: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: '2px',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tableSelect: {
    padding: '0.35rem 1.25rem 0.35rem 0.75rem',
    background: 'rgba(197, 168, 92, 0.04)',
    border: '1px solid rgba(197, 168, 92, 0.15)',
    borderRadius: '6px',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    background: 'rgba(197, 168, 92, 0.03)',
    border: '1px solid rgba(197, 168, 92, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45, 41, 34, 0.45)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: '600px',
    padding: '2rem',
    borderRadius: '18px',
    boxShadow: '0 20px 50px rgba(197, 168, 92, 0.15)',
    animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  liveCalculation: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: 'rgba(197, 168, 92, 0.05)',
    border: '1px solid rgba(197, 168, 92, 0.15)',
    borderRadius: '10px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
};
