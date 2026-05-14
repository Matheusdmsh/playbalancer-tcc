import { Group } from "@/services/groups"

/**
 * Verifica se o usuário é o owner do grupo (super admin)
 */
export const isGroupOwner = (group: Group | null, userId: string | undefined): boolean => {
  if (!group || !userId) return false
  return group.owner_id === userId
}

/**
 * Verifica se o usuário é admin do grupo (owner OU está na lista de admins)
 */
export const isGroupAdmin = (group: Group | null, userId: string | undefined): boolean => {
  if (!group || !userId) return false
  return (
    group.owner_id === userId ||
    Boolean(group.admins && group.admins.includes(userId))
  )
}

/**
 * Verifica se o usuário é membro regular do grupo (não é admin)
 */
export const isGroupMember = (group: Group | null, userId: string | undefined): boolean => {
  if (!group || !userId) return false
  const isMember = group.members?.some(m => {
    const memberId = (m as any)._id || (m as any).id
    return memberId === userId
  }) ?? false
  return isMember && !isGroupAdmin(group, userId)
}

/**
 * Retorna o nível de permissão do usuário no grupo
 */
export type PermissionLevel = "owner" | "admin" | "member" | "none"

export const getGroupPermissionLevel = (
  group: Group | null,
  userId: string | undefined
): PermissionLevel => {
  if (!group || !userId) return "none"

  if (isGroupOwner(group, userId)) return "owner"
  if (group.admins && group.admins.includes(userId)) return "admin"
  if (isGroupMember(group, userId)) return "member"

  return "none"
}

/**
 * Verifica se o usuário pode realizar uma ação específica
 */
export const canUserPerformAction = (
  group: Group | null,
  userId: string | undefined,
  action: "edit" | "delete" | "manage_admins" | "manage_members" | "view"
): boolean => {
  const permLevel = getGroupPermissionLevel(group, userId)

  switch (action) {
    case "view":
      return permLevel !== "none"

    case "edit":
      return permLevel === "admin" || permLevel === "owner"

    case "delete":
      return permLevel === "owner"

    case "manage_admins":
      return permLevel === "owner"

    case "manage_members":
      return permLevel === "admin" || permLevel === "owner"

    default:
      return false
  }
}

/**
 * Retorna uma lista de ações que o usuário pode fazer no grupo
 */
export const getAvailableActions = (
  group: Group | null,
  userId: string | undefined
): Array<"edit" | "delete" | "manage_admins" | "manage_members" | "view"> => {
  const actions: Array<"edit" | "delete" | "manage_admins" | "manage_members" | "view"> = []

  if (canUserPerformAction(group, userId, "view")) actions.push("view")
  if (canUserPerformAction(group, userId, "edit")) actions.push("edit")
  if (canUserPerformAction(group, userId, "delete")) actions.push("delete")
  if (canUserPerformAction(group, userId, "manage_admins")) actions.push("manage_admins")
  if (canUserPerformAction(group, userId, "manage_members")) actions.push("manage_members")

  return actions
}
