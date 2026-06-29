// GitHub 数据层 - 使用 GitHub API 做数据库
// 所有数据以 JSON 文件存储在 warehouse-data 仓库中

// Token 通过构建时环境变量注入，不硬编码
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN
const DATA_REPO = 'rootgrac/warehouse-data'
const API_BASE = 'https://api.github.com'

// 延迟函数
const delay = ms => new Promise(r => setTimeout(r, ms))

// GitHub API 请求封装
async function githubAPI(path, options = {}) {
  const url = `${API_BASE}/repos/${DATA_REPO}/contents/${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `API error: ${res.status}`)
  }
  return res.json()
}

// 读取 JSON 文件内容
async function readFile(path) {
  try {
    const data = await githubAPI(path)
    // GitHub API 返回 base64 编码的内容
    const content = atob(data.content.replace(/\n/g, ''))
    return JSON.parse(content)
  } catch (e) {
    // 文件不存在返回 null
    if (e.message.includes('404') || e.message.includes('Not Found')) return null
    throw e
  }
}

// 写入 JSON 文件
async function writeFile(path, content, message = 'update') {
  let sha = undefined
  try {
    const existing = await githubAPI(path)
    sha = existing.sha
  } catch (e) {
    // 文件不存在，新建
  }

  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    ...(sha ? { sha } : {}),
  }

  return githubAPI(path, { method: 'PUT', body: JSON.stringify(body) })
}

// ============================================
// 业务接口
// ============================================

// 用户相关
export async function getUser(userId) {
  const users = await readFile('users.json')
  return users?.[userId] || null
}

export async function createUser(userId, name) {
  const users = await readFile('users.json') || {}
  users[userId] = { id: userId, name, created_at: new Date().toISOString() }
  await writeFile('users.json', users, `创建用户 ${name}`)
  return users[userId]
}

// 团队相关
export async function getTeam(teamId) {
  const teams = await readFile('teams.json')
  return teams?.[teamId] || null
}

export async function getTeamByCode(inviteCode) {
  const teams = await readFile('teams.json') || {}
  return Object.values(teams).find(t => t.invite_code === inviteCode) || null
}

export async function createTeam(name, inviteCode, createdBy) {
  const teams = await readFile('teams.json') || {}
  const id = 't_' + Date.now()
  const team = { id, name, invite_code: inviteCode, created_by: createdBy, created_at: new Date().toISOString() }
  teams[id] = team
  await writeFile('teams.json', teams, `创建团队 ${name}`)

  // 自动加入
  const members = await readFile('team_members.json') || {}
  members[id] = members[id] || []
  members[id].push({ user_id: createdBy, joined_at: new Date().toISOString() })
  await writeFile('team_members.json', members, `${createdBy} 加入团队 ${name}`)

  return team
}

export async function joinTeam(teamId, userId) {
  const members = await readFile('team_members.json') || {}
  members[teamId] = members[teamId] || []
  if (members[teamId].find(m => m.user_id === userId)) {
    throw new Error('已在团队中')
  }
  members[teamId].push({ user_id: userId, joined_at: new Date().toISOString() })
  await writeFile('team_members.json', members, `${userId} 加入团队`)
}

export async function getTeamForUser(userId) {
  const members = await readFile('team_members.json') || {}
  for (const [teamId, memberList] of Object.entries(members)) {
    if (memberList.find(m => m.user_id === userId)) {
      const teams = await readFile('teams.json') || {}
      return teams[teamId] || null
    }
  }
  return null
}

// 货物相关
export async function getProducts(teamId) {
  const products = await readFile('products.json') || {}
  return Object.values(products).filter(p => p.team_id === teamId)
}

export async function addProduct(product) {
  const products = await readFile('products.json') || {}
  const id = 'p_' + Date.now()
  const newProduct = { id, ...product, current_stock: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  products[id] = newProduct
  await writeFile('products.json', products, `添加货物 ${product.name}`)
  return newProduct
}

export async function updateProductStock(productId, newStock, newPrice) {
  const products = await readFile('products.json') || {}
  if (!products[productId]) throw new Error('货物不存在')
  products[productId].current_stock = newStock
  if (newPrice !== undefined) products[productId].unit_price = newPrice
  products[productId].updated_at = new Date().toISOString()
  await writeFile('products.json', products, `更新库存 ${products[productId].name}`)
  return products[productId]
}

export async function deleteProduct(productId) {
  const products = await readFile('products.json') || {}
  delete products[productId]
  await writeFile('products.json', products, `删除货物`)
}

// 入库记录
export async function addStockIn(record) {
  const records = await readFile('stock_in_records.json') || []
  records.unshift({ id: 'si_' + Date.now(), ...record, created_at: new Date().toISOString() })
  await writeFile('stock_in_records.json', records, '入库')
  return records[0]
}

export async function getStockInRecords(teamId) {
  const records = await readFile('stock_in_records.json') || []
  return records.filter(r => r.team_id === teamId)
}

// 出库记录
export async function addStockOut(record) {
  const records = await readFile('stock_out_records.json') || []
  records.unshift({ id: 'so_' + Date.now(), ...record, created_at: new Date().toISOString() })
  await writeFile('stock_out_records.json', records, '出库')
  return records[0]
}

export async function getStockOutRecords(teamId) {
  const records = await readFile('stock_out_records.json') || []
  return records.filter(r => r.team_id === teamId)
}

// 生成邀请码
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
