// Vercel Serverless Function - Supabase 代理
// 前端请求走这里，服务器端转发到 Supabase，绕过 GFW

const SUPABASE_URL = 'https://glmzdtsvulcfohhtfaxr.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsbXpkdHN2dWxjZm9odHRmYXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDM4MzQsImV4cCI6MjA5ODMxOTgzNH0.ICTr7nuLTMLUFtryudzoWomLatcvh8l371dPZ8QXA98'

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, Prefer')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 从 URL 中提取 Supabase 路径
  // 请求: /api/supabase/rest/v1/products?select=*
  // 转发到: https://xxx.supabase.co/rest/v1/products?select=*
  const supabasePath = req.url.replace('/api/supabase', '')

  const url = `${SUPABASE_URL}${supabasePath}`
  console.log('Proxying to:', url)

  try {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': req.headers.authorization || `Bearer ${SUPABASE_KEY}`,
      'Content-Type': req.headers['content-type'] || 'application/json',
    }

    // 转发 Prefer 头
    if (req.headers.prefer) {
      headers['Prefer'] = req.headers.prefer
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.text()
    res.status(response.status).send(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(502).json({ error: 'Proxy error', message: error.message })
  }
}
