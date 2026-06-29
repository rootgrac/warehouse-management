import { createClient } from '@supabase/supabase-js'

// 部署前请替换为你的 Supabase 项目信息
// 在 https://app.supabase.com 或 https://memfirecloud.com 创建项目后获取
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
