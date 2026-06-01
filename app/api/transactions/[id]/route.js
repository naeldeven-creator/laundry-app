import { getSupabaseServer } from '@/lib/supabaseServer';

// PUT: Memperbarui detail transaksi laundry (misal: ganti status cuci atau status pembayaran)
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      return Response.json({ error: 'Autentikasi diperlukan. Silakan login.' }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer(req);

    // Ambil info user
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

    // Persiapkan data yang akan diperbarui
    const updateData = {};
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (customer_phone !== undefined) updateData.customer_phone = customer_phone;
    if (weight !== undefined) updateData.weight = Number(weight);
    if (service_type !== undefined) updateData.service_type = service_type;
    if (price_per_kg !== undefined) updateData.price_per_kg = Number(price_per_kg);
    if (status !== undefined) updateData.status = status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (notes !== undefined) updateData.notes = notes;

    // Jika berat atau harga per kg diperbarui, hitung ulang total_price
    if (weight !== undefined || price_per_kg !== undefined) {
      // Ambil transaksi lama jika salah satu dari weight atau price_per_kg tidak dikirimkan
      let currentWeight = weight;
      let currentPrice = price_per_kg;

      if (weight === undefined || price_per_kg === undefined) {
        const { data: oldTx } = await supabaseServer
          .from('transactions')
          .select('weight, price_per_kg')
          .eq('id', id)
          .single();

        if (oldTx) {
          currentWeight = weight !== undefined ? weight : oldTx.weight;
          currentPrice = price_per_kg !== undefined ? price_per_kg : oldTx.price_per_kg;
        }
      }

      updateData.total_price = Number(currentWeight) * Number(currentPrice);
    }

    // Jalankan update di Supabase (RLS akan memastikan user hanya bisa mengubah miliknya sendiri)
    const { data, error } = await supabaseServer
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Transaksi berhasil diperbarui', data });
  } catch (error) {
    return Response.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}

// DELETE: Menghapus transaksi laundry
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
      return Response.json({ error: 'Autentikasi diperlukan. Silakan login.' }, { status: 401 });
    }

    const supabaseServer = getSupabaseServer(req);

    // Ambil info user
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Autentikasi tidak valid.' }, { status: 401 });
    }

    // Hapus data (RLS memastikan user hanya bisa menghapus miliknya sendiri)
    const { error } = await supabaseServer
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    return Response.json({ error: 'Terjadi kesalahan pada server: ' + error.message }, { status: 500 });
  }
}
