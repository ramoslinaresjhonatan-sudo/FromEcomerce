export const getStoredUser = () => {
  const raw = localStorage.getItem('user')
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const normalizeRole = (user) =>
  String(user?.user_type || user?.role_scope || user?.tipo_usuario || '')
    .trim()
    .toUpperCase()

export const isPlatformAdmin = (user) =>
  ['SUPERUSER', 'MODERATOR'].includes(normalizeRole(user))

export const isStoreAdmin = (user) => normalizeRole(user) === 'STORE_ADMIN'

export const canAccessDashboard = (user) =>
  isPlatformAdmin(user) || isStoreAdmin(user)

export const getCurrentCompanyId = (user) =>
  user?.current_company || user?.company || user?.active_company_id || null

export const getCurrentStoreId = (user) =>
  user?.current_store || user?.store || user?.active_store_id || null

export const isUnlimited = (limit) =>
  limit === null || limit === undefined || limit === ''

export const hasReachedLimit = (currentCount, limit) => {
  if (isUnlimited(limit)) return false
  return Number(currentCount) >= Number(limit)
}
