'use client'

import { Crown, ShieldPlus, UserIcon, Ghost } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface UserRoleBadgeProps {
  role: 'owner' | 'admin' | 'member' | 'reserva'
  iconSize?: 'sm' | 'lg'
  isSelf?: boolean
  iconOnly?: boolean
  variant?: 'default' | 'subtle'
}

export function UserRoleBadge({ role, iconSize = 'sm', isSelf, iconOnly, variant = 'default' }: UserRoleBadgeProps) {
  if (isSelf) {
    return (
      <Badge className="bg-zinc-700 text-zinc-200 border-0 text-xs">
        Você
      </Badge>
    )
  }

  const roleConfig = {
    owner: {
      badge: 'bg-amber-800 text-amber-300 hover:bg-amber-600',
      icon: Crown,
      label: 'Dono',
    },
    admin: {
      badge: 'bg-green-800 text-green-300 hover:bg-green-600',
      icon: ShieldPlus,
      label: 'Admin',
    },
    member: {
      badge: 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600',
      icon: UserIcon,
      label: 'Membro',
    },
    reserva: {
      badge: 'bg-purple-800 text-purple-300 hover:bg-purple-600',
      icon: Ghost,
      label: 'Reserva',
    },
  }

  const config = roleConfig[role]
  const IconComponent = config.icon
  const iconSizeClass = iconSize === 'sm' ? 'w-3 h-3' : 'w-5 h-5'

  if (iconOnly) {
    const colorMap = {
      owner: 'text-amber-300',
      admin: 'text-green-300',
      member: 'text-zinc-200',
      reserva: 'text-purple-300',
    }
    return (
      <IconComponent className={`${iconSizeClass} ${colorMap[role]}`} />
    )
  }

  if (variant === 'subtle') {
    const colorMap = {
      owner: 'text-amber-400',
      admin: 'text-green-400',
      member: 'text-zinc-400',
      reserva: 'text-purple-400',
    }
    return (
      <div className="flex items-center gap-0.5 text-xs">
        <IconComponent className={`${iconSizeClass} ${colorMap[role]}`} />
        <span className={colorMap[role]}>{config.label}</span>
      </div>
    )
  }

  return (
    <Badge className={`border-0 text-xs ${config.badge}`}>
      <IconComponent className={iconSizeClass} />
      <span className="ml-1">{config.label}</span>
    </Badge>
  )
}
