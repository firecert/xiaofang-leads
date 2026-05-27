-- Supabase SQL 建表语句
-- 在 Supabase 控制台 -> SQL Editor 中运行

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  note TEXT DEFAULT '',
  source TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 Row Level Security（行级安全）
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取和写入（基于 anon key）
CREATE POLICY "允许匿名插入" ON leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "允许匿名查询" ON leads FOR SELECT TO anon USING (true);
CREATE POLICY "允许匿名更新" ON leads FOR UPDATE TO anon USING (true);
CREATE POLICY "允许匿名删除" ON leads FOR DELETE TO anon USING (true);
