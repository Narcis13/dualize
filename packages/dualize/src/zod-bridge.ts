import { z } from "zod"

interface CittyArg {
  type: "string" | "boolean"
  description: string
  required: boolean
  default?: string
}

function unwrapZod(schema: z.ZodTypeAny): { base: z.ZodTypeAny; optional: boolean; defaultValue?: unknown } {
  let current = schema
  let optional = false
  let defaultValue: unknown = undefined

  while (true) {
    if (current instanceof z.ZodOptional) {
      optional = true
      current = current._def.innerType
    } else if (current instanceof z.ZodDefault) {
      optional = true
      defaultValue = current._def.defaultValue()
      current = current._def.innerType
    } else if (current instanceof z.ZodNullable) {
      optional = true
      current = current._def.innerType
    } else {
      break
    }
  }

  return { base: current, optional, defaultValue }
}

export function zodToCittyArgs(schema: z.ZodObject<any>): Record<string, CittyArg> {
  const args: Record<string, CittyArg> = {}

  for (const [key, field] of Object.entries(schema.shape)) {
    const f = field as z.ZodTypeAny
    const { base, optional, defaultValue } = unwrapZod(f)

    const isBoolean = base instanceof z.ZodBoolean

    args[key] = {
      type: isBoolean ? "boolean" : "string",
      description: f.description ?? "",
      required: !optional,
      ...(defaultValue !== undefined ? { default: String(defaultValue) } : {}),
    }
  }

  return args
}

export function parseCliInput(schema: z.ZodObject<any>, raw: Record<string, unknown>): Record<string, unknown> {
  const coerced: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(schema.shape)) {
    const value = raw[key]
    if (value === undefined) continue

    const { base } = unwrapZod(field as z.ZodTypeAny)

    if (base instanceof z.ZodNumber && typeof value === "string") {
      coerced[key] = Number(value)
    } else if (base instanceof z.ZodBoolean && typeof value === "string") {
      coerced[key] = value === "true" || value === "1"
    } else {
      coerced[key] = value
    }
  }

  return coerced
}
