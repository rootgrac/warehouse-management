// 数据层 - 纯浏览器本地存储
// 数据存在 localStorage 中，无需任何后端

// ============ localStorage 工具函数 ============

function localGet(key) {
  try {
    const raw = localStorage.getItem('wm_' + key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.error('localStorage read error:', e)
    return null
  }
}

function localSet(key, data) {
  try {
    localStorage.setItem('wm_' + key, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('localStorage write error:', e)
    return false
  }
}

// ============ 用户 ============

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

// ============ 团队 ============

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
  const team = {
    id,
    name,
    invite_code: inviteCode,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  }
  teams[id] = team
  localSet('teams', teams)

  // 创建者自动加入
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

// ============ 货物 ============

export async function getProducts(teamId) {
  const products = localGet('products') || {}
  return Object.values(products).filter(p => p.team_id === teamId)
}

export async function addProduct(product) {
  const products = localGet('products') || {}
  const id = 'p_' + Date.now()
  const newProduct = {
    id,
    ...product,
    current_stock: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
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

// ============ 入库记录 ============

export async function addStockIn(record) {
  const records = localGet('stock_in') || []
  records.unshift({
    id: 'si_' + Date.now(),
    ...record,
    created_at: new Date().toISOString(),
  })
  localSet('stock_in', records)
  return records[0]
}

export async function getStockInRecords(teamId) {
  return (localGet('stock_in') || []).filter(r => r.team_id === teamId)
}

// ============ 出库记录 ============

export async function addStockOut(record) {
  const records = localGet('stock_out') || []
  records.unshift({
    id: 'so_' + Date.now(),
    ...record,
    created_at: new Date().toISOString(),
  })
  localSet('stock_out', records)
  return records[0]
}

export async function getStockOutRecords(teamId) {
  return (localGet('stock_out') || []).filter(r => r.team_id === teamId)
}

// ============ 邀请码 ============

export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}
