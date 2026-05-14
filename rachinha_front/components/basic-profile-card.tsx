"use client"

import Image from "next/image"
import { User2, AtSign, Mail } from "lucide-react"

interface BasicProfileCardProps {
  photoUrl?: string
  name?: string
  nickname?: string
  username?: string
  email?: string
  initials?: string
}

export function BasicProfileCard({
  photoUrl,
  name,
  nickname,
  username,
  email,
  initials = "?",
}: BasicProfileCardProps) {
  return (
    <div className="w-full md:w-2/5 flex flex-col items-center gap-6">
      {/* Avatar */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-400 bg-zinc-800 flex items-center justify-center flex-shrink-0">
        {photoUrl && !photoUrl.includes("placeholder") ? (
          <Image
            src={photoUrl}
            alt={name || "Perfil"}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <span className="text-4xl font-bold text-green-400">{initials}</span>
        )}
      </div>

      {/* Informações */}
      <div className="w-full text-center space-y-4">
        {/* Nome */}
        {name && (
          <div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
          </div>
        )}

        {/* Apelido */}
        {nickname && (
          <div className="flex items-center justify-center gap-2">
            <User2 className="h-4 w-4 text-green-400" />
            <p className="text-sm text-zinc-300">{nickname}</p>
          </div>
        )}

        {/* Username */}
        {username && (
          <div className="flex items-center justify-center gap-2">
            <AtSign className="h-4 w-4 text-green-400" />
            <p className="text-sm text-zinc-400">@{username}</p>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4 text-green-400" />
            <p className="text-sm text-zinc-400">{email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
