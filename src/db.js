// 数据层 - localStorage 本地存储 + GitHub 同步
// 先用本地存储保证可用，GitHub 可访问时自动同步

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || ''
const DATA_REPO = 'rootgrac/warehouse-data'
const API_BASE = 'https://api.github.com'

// ============ localStorage 操作 ============

function localGet(key) {
  try {
    const raw = localStorage.getItem('wm_' + key)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function localSet(key, data) {
  localStorage.setItem('wm_' + key, JSON.stringify(data))
}

// ============ GitHub API 操作（可选同步）============

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

async function readGithubFile(path) {
  try {
    const data = await githubAPI(path)
    const content = JSON.parse(atob(data.content.replace(/\n/g, '')))
    return { data, sha: data.sha }
  } catch (e) {
    if (e.message.includes('404') || e.message.includes('Not Found')) return null
    throw e
  }
}

async function writeGithubFile(path, content, message = 'update') {
  let sha = undefined
  try {
    const existing = await readGithubFile(path)
    if (existing) sha = existing.sha
  } catch (e) {}

  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
    ...(sha ? { sha } : {}),
  }

  return githubAPI(path, { method: 'PUT', body: JSON.stringify(body) })
}

let githubAvailable = null

async function checkGithub() {
  if (githubAvailable !== null) return githubAvailable
  if (!GITHUB_TOKEN) { githubAvailable = false; return false }
  try {
    await fetch(`${API_BASE}/zen`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    })
    githubAvailable = true
  } catch {
    githubAvailable = false
  }
  return githubAvailable
}

// ============ 业务接口 ============

// 用户
export async function getUser(userId) {
  const users = localGet('users') || {}
  return users[userId] || null
}

export async function createUser(userId, name) {
  const users = localGet('users') || {}
  users[userId] = { id: userId, name, created_at: new Date().toISOString() }
  localSet('users', users)
  return users[userId]
}

// 团队
export async function getTeam(teamId) {
  const teams = localGet('teams') || {}
  return teams[teamId] || null
}

export async function getTeamByCode(inviteCode) {
  const teams = localGet('teams') || {}
  return Object.values(teams).find(t => t.invite_code === inviteCode) || null
}

export async function createTeam(name, inviteCode, createdBy) {
  const teams = localGet('teams') || {}
  const id = 't_' + Date.now()
  const team = { id, name, invite_code: inviteCode, created_by: createdBy, created_at: new Date().toISOString() }
  teams[id] = team
  localSet('teams', teams)

  const members = localGet('members') || {}
  members[id] = [{ user_id: createdBy, joined_at: new Date().toISOString() }]
  localSet('members', members)

  return team
}

export async function joinTeam(teamId, userId) {
  const members = localGet('members') || {}
  members[teamId] = members[teamId] || []
  if (members[teamId].find(m => m.user_id === userId)) {
    throw new Error('已在团队中')
  }
  members[teamId].push({ user_id: userId, joined_at: new Date().toISOString() })
  localSet('members', members)

  // 同步到 GitHub（如果可用）
  const ok = await checkGithub()
  if (ok) {
    try {
      const data = {
        teams: localGet('teams'),
        members: localGet('members'),
      }
      await writeGithubFile('data.json', data, `${userId} 加入团队`)
    } catch (e) { console.log('GitHub sync failed:', e.message) }
  }
}

export async function getTeamForUser(userId) {
  const members = localGet('members') || {}
  for (const [teamId, memberList] of Object.entries(members)) {
    if (memberList.find(m => m.user_id === userId)) {
      const teams = localGet('teams') || {}
      return teams[teamId] || null
    }
  }
  return null
}

// 货物
export async function getProducts(teamId) {
  const products = localGet('products') || {}
  return Object.values(products).filter(p => p.team_id === teamId)
}

export async function addProduct(product) {
  const products = localGet('products') || {}
  const id = 'p_' + Date.now()
  const newProduct = { id, ...product, current_stock: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  products[id] = newProduct
  localSet('products', products)
  return newProduct
}

export async function updateProductStock(productId, newStock, newPrice) {
  const products = localGet('products') || {}
  if (!products[productId]) throw new Error('货物不存在')
  products[productId].current_stock = newStock
  if (newPrice !== undefined) products[productId].unit_price = newPrice
  products[productId].updated_at = new Date().toISOString()
  localSet('products', products)
  return products[productId]
}

export async function deleteProduct(productId) {
  const products = localGet('products') || {}
  delete products[productId]
  localSet('products', products)
}

// 入库记录
export async function addStockIn(record) {
  const records = localGet('stock_in') || []
  records.unshift({ id: 'si_' + Date.now(), ...record, created_at: new Date().toISOString() })
  localSet('stock_in', records)
  return records[0]
}

export async function getStockInRecords(teamId) {
  return (localGet('stock_in') || []).filter(r => r.team_id === teamId)
}

// 出库记录
export async function addStockOut(record) {
  const records = localGet('stock_out') || []
  records.unshift({ id: 'so_' + Date.now(), ...record, created_at: new Date().toISOString() })
  localSet('stock_out', records)
  return records[0]
}

export async function getStockOutRecords(teamId) {
  return (localGet('stock_out') || []).filter(r => r.team_id === teamId)
}

// 邀请码
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
