-- Supabase SQL để tạo bảng players
-- Chạy script này trong Supabase SQL Editor

-- Tạo bảng players
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bật Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả mọi người đọc danh sách players
CREATE POLICY "Allow public read access" ON players
    FOR SELECT
    USING (true);

-- Cho phép tất cả mọi người thêm player mới
CREATE POLICY "Allow public insert access" ON players
    FOR INSERT
    WITH CHECK (true);

-- Cho phép tất cả mọi người xóa player
CREATE POLICY "Allow public delete access" ON players
    FOR DELETE
    USING (true);

-- Bật Realtime cho bảng players
ALTER PUBLICATION supabase_realtime ADD TABLE players;
