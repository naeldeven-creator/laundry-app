-- SQL Script untuk setup database laundry di Supabase SQL Editor

-- 1. Buat Tabel laundry_transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    weight NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    service_type TEXT NOT NULL DEFAULT 'Regular', -- e.g., 'Regular', 'Express'
    price_per_kg NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'queued', -- 'queued' (antrean), 'washing' (cuci), 'drying' (pengering), 'ready' (selesai), 'taken' (diambil)
    payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid' (belum bayar), 'paid' (lunas)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) agar user hanya bisa membaca/menulis datanya sendiri
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 2. Buat Kebijakan RLS (Policies)

-- Kebijakan untuk Insert: User hanya bisa memasukkan data transaksi yang memiliki user_id sama dengan id auth mereka sendiri
CREATE POLICY "Users can insert their own transactions" ON public.transactions
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Kebijakan untuk Select: User hanya bisa membaca data mereka sendiri
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Kebijakan untuk Update: User hanya bisa mengubah data mereka sendiri
CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Kebijakan untuk Delete: User hanya bisa menghapus data mereka sendiri
CREATE POLICY "Users can delete their own transactions" ON public.transactions
    FOR DELETE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- 3. Fungsi & Trigger untuk otomatis memperbarui kolom updated_at saat data diubah
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_modtime
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
