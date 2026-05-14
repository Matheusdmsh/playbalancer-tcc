"use client"

import * as React from "react"
import { X, Users } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INPUT_STYLES } from "@/lib/groupFormConstants"
import { Control, FieldPath, FieldValues } from "react-hook-form"

interface MaxPlayersFieldProps<T extends FieldValues, K extends FieldPath<T>> {
  control: Control<T>
  name: K
  label?: string
  placeholder?: string
}

export function MaxPlayersField<T extends FieldValues, K extends FieldPath<T>>({
  control,
  name,
  label = "Máx de Jogadores",
  placeholder = "Selecione a quantidade",
}: MaxPlayersFieldProps<T, K>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-zinc-200">
            {label}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
                  <Users className="h-4 w-4" />
                </span>
                <SelectTrigger className={`${INPUT_STYLES.select} pl-10 ${field.value ? 'pr-8' : ''}`}>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                {field.value && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      field.onChange("")
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </FormControl>
            <SelectContent className={INPUT_STYLES.selectContent}>
              {Array.from({ length: 29 }, (_, i) => i + 2).map(num => (
                <SelectItem key={num} value={String(num)}>
                  {num} jogadores
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
