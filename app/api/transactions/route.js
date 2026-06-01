import { getSupabaseServer } from '@/lib/supabaseServer';

// GET: Mengambil semua transaksi milik user yang sedang login
export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      return Response.json({ error: 'Autentikasi diperlukan. Silakan login.' }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer(req);

    // Ambil info user untuk verifikasi
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Autentikasi tidak valid.' }, { status: 401 });
    }

    // Ambil query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseServer
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter berdasarkan status jika disediakan
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter berdasarkan pencarian nama pelanggan jika disediakan
    if (search) {
      query = query.ilike('customer_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}

// POST: Membuat transaksi laundry baru
export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      return Response.json({ error: 'Autentikasi diperlukan. Silakan login.' }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer(req);

    // Dapatkan info user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Autentikasi tidak valid.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      customer_name,
      customer_phone,
      weight,
      service_type,
      price_per_kg,
      status,
      payment_status,
      notes
    } = body;

    // Validasi input sederhana
    if (!customer_name) {
      return Response.json({ error: 'Nama pelanggan wajib diisi.' }, { status: 400 });
    }
    if (weight === undefined || weight < 0) {
      return Response.json({ error: 'Berat pakaian tidak valid.' }, { status: 400 });
    }
    if (price_per_kg === undefined || price_per_kg < 0) {
      return Response.json({ error: 'Harga per kg tidak valid.' }, { status: 400 });
    }

    // Hitung total_price secara otomatis
    const total_price = Number(weight) * Number(price_per_kg);

    // Masukkan data dengan user_id yang sesuai
    const { data, error } = await supabaseServer
      .from('transactions')
      .insert({
        user_id: user.id,
        customer_name,
        customer_phone,
        weight: Number(weight),
        service_type: service_type || 'Regular',
        price_per_kg: Number(price_per_kg),
        total_price,
        status: status || 'queued',
        payment_status: payment_status || 'unpaid',
        notes
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Transaksi berhasil dibuat', data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}
