"use client"

import { ChangeEvent } from "react"
import { Control, useFormContext, useWatch } from "react-hook-form"
import { Banknote } from "lucide-react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { INPUT_STYLES, PRICE_TYPE_DESCRIPTIONS } from "@/lib/groupFormConstants"

interface PriceFieldProps {
  control: Control<any>
  priceName?: string
  priceTypeName?: string
}

export function PriceField({ 
  control, 
  priceName = "price", 
  priceTypeName = "price_type" 
}: PriceFieldProps) {
  const { setValue, getValues, formState } = useFormContext()

  const priceValue = useWatch({ control, name: priceName })
  const priceTypeValue = useWatch({ control, name: priceTypeName })

  const formatCurrencyDisplay = (value: number | undefined) => {
    if (!value && value !== 0) return ""
    if (isNaN(value)) return ""
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={priceName}
          render={({ field }) => {
            const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
              const onlyDigits = e.target.value.replace(/\D/g, "")
              const numericValue = onlyDigits ? Number(onlyDigits) / 100 : null

              field.onChange(numericValue ?? undefined)

              // Se preencheu um valor e price_type está vazio, define como per_person automaticamente
              const currentPriceType = getValues(priceTypeName)
              if (numericValue && numericValue > 0 && !currentPriceType) {
                setValue(priceTypeName, "per_person")
              }
              // Se apagou o valor, limpa o price_type
              if (!numericValue || numericValue <= 0) {
                setValue(priceTypeName, undefined)
              }
            }

            return (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-200">
                  Valor
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                      <Banknote className="h-4 w-4" />
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0,00"
                      value={formatCurrencyDisplay(field.value ?? undefined)}
                      onChange={handlePriceChange}
                      className={`${INPUT_STYLES.base} text-right`}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )
          }}
        />

        <FormField
          control={control}
          name={priceTypeName}
          render={({ field }) => {
            const hasPrice = priceValue && priceValue > 0
            return (
              <FormItem>
                <FormLabel className="text-sm font-medium text-zinc-200">
                  Tipo de Valor
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={hasPrice ? (field.value || "") : undefined}
                  disabled={!hasPrice}
                >
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
                        <Banknote className="h-4 w-4" />
                      </span>
                      <SelectTrigger
                        className={`${INPUT_STYLES.select} disabled:opacity-50 disabled:cursor-not-allowed text-left pl-10`}
                      >
                        <SelectValue placeholder={hasPrice ? "Selecione o tipo" : "Preencha o valor"} />
                      </SelectTrigger>
                    </div>
                  </FormControl>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="per_person">Por Pessoa</SelectItem>
                    <SelectItem value="total_split">Valor Total</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )
          }}
        />
      </div>

      {/* Informações sobre o tipo de valor */}
      <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700">
        {!priceValue || priceValue <= 0 ? (
          <p className="text-xs text-zinc-400">Coloque o valor para selecionar seu tipo.</p>
        ) : formState.errors?.[priceTypeName]?.message ? (
          <p className="text-xs text-red-400">
            {String(formState.errors?.[priceTypeName]?.message)}
          </p>
        ) : priceTypeValue === "total_split" ? (
          <p className="text-xs text-zinc-300">
            <span className={`font-semibold text-${PRICE_TYPE_DESCRIPTIONS.total_split.color}`}>
              {PRICE_TYPE_DESCRIPTIONS.total_split.label}
            </span>{" "}
            {PRICE_TYPE_DESCRIPTIONS.total_split.description}
          </p>
        ) : priceTypeValue === "per_person" ? (
          <p className="text-xs text-zinc-300">
            <span className={`font-semibold text-${PRICE_TYPE_DESCRIPTIONS.per_person.color}`}>
              {PRICE_TYPE_DESCRIPTIONS.per_person.label}
            </span>{" "}
            {PRICE_TYPE_DESCRIPTIONS.per_person.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-400">Selecione um tipo de valor para ver a descrição</p>
        )}
      </div>
    </>
  )
}
