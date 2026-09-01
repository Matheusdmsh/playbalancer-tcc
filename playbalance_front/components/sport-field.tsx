"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { X } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSportIcon } from "@/lib/getSportIcon"
import { SPORTS, INPUT_STYLES } from "@/lib/groupFormConstants"
import { Control, FieldPath, FieldValues } from "react-hook-form"
import { cn } from "@/lib/utils"

interface SportFieldProps<T extends FieldValues, K extends FieldPath<T>> {
  control: Control<T>
  name: K
  label?: string
  placeholder?: string
}

// CustomSelectItem com ícone que muda de cor quando selecionado
const SportSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { sport: string }
>(({ className, children, sport, ...props }, ref) => {
  const [isSelected, setIsSelected] = React.useState(false)
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-zinc-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onMouseEnter={() => setIsSelected(true)}
      onMouseLeave={() => setIsSelected(false)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SportSelectItem.displayName = "SportSelectItem"

export function SportField<T extends FieldValues, K extends FieldPath<T>>({
  control,
  name,
  label = "Modalidade",
  placeholder = "Selecione um esporte",
}: SportFieldProps<T, K>) {
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
                <SelectTrigger className={`${INPUT_STYLES.select} ${field.value ? 'pr-8' : ''}`}>
                  {field.value ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-zinc-400">
                        {getSportIcon(field.value)}
                      </span>
                      <span>{field.value}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        </svg>
                      </span>
                      <SelectValue placeholder={placeholder} />
                    </div>
                  )}
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
              {SPORTS.map(sport => (
                <SportSelectItem key={sport} value={sport} sport={sport}>
                  <div className="flex items-center gap-2 group">
                    <span className="inline-flex items-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-zinc-400 group-data-[highlighted]:[&_svg]:text-green-400 [.radix-select-item[data-state=checked]_&]:[&_svg]:text-green-400">
                      {getSportIcon(sport)}
                    </span>
                    <span>{sport}</span>
                  </div>
                </SportSelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
