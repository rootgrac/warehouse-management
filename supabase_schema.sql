-- ============================================
-- 仓库管理系统 - Supabase 数据库建表语句
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 创建团队表
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建团队成员表
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 3. 创建用户信息表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建货物表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  spec TEXT DEFAULT '',
  unit TEXT DEFAULT '个',
  current_stock INTEGER DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 入库记录表
CREATE TABLE IF NOT EXISTS stock_in_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) DEFAULT 0,
  operator UUID REFERENCES auth.users(id) NOT NULL,
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 出库记录表
CREATE TABLE IF NOT EXISTS stock_out_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  operator UUID REFERENCES auth.users(id) NOT NULL,
  remark TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 启用 Row Level Security
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS 策略：用户只能看到自己团队的数据
-- ============================================

-- profiles: 用户可读写自己的信息
CREATE POLICY "用户管理自己的信息" ON profiles
  FOR ALL USING (auth.uid() = id);

-- team_members: 团队成员可查看成员列表
CREATE POLICY "团队成员可查看成员" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "用户可加入团队" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- teams: 团队成员可查看团队信息
CREATE POLICY "团队成员可查看团队" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
CREATE POLICY "用户可创建团队" ON teams
  FOR INSERT WITH CHECK (true);

-- products: 团队成员可读写货物
CREATE POLICY "团队成员可读写货物" ON products
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- stock_in_records: 团队成员可读写入库记录
CREATE POLICY "团队成员可读写入库记录" ON stock_in_records
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- stock_out_records: 团队成员可读写出库记录
CREATE POLICY "团队成员可读写出库记录" ON stock_out_records
  FOR ALL USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- ============================================
-- 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_products_team ON products(team_id);
CREATE INDEX IF NOT EXISTS idx_stock_in_team ON stock_in_records(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_out_team ON stock_out_records(team_id, created_at DESC);

-- ============================================
-- 启用 Realtime (Supabase 控制台中也要开启)
-- 在 Supabase Dashboard → Database → Replication 中
-- 手动开启 products 表的 Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE products;
