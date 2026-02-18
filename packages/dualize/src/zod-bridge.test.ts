import { describe, test, expect } from "bun:test"
import { z } from "zod"
import { zodToCittyArgs, parseCliInput } from "./zod-bridge"

describe("zodToCittyArgs", () => {
  test("converts string field", () => {
    const schema = z.object({ name: z.string().describe("Product name") })
    const args = zodToCittyArgs(schema)
    expect(args.name).toEqual({
      type: "string",
      description: "Product name",
      required: true,
    })
  })

  test("converts number field as string (parsed later)", () => {
    const schema = z.object({ price: z.number().describe("Price") })
    const args = zodToCittyArgs(schema)
    expect(args.price.type).toBe("string")
    expect(args.price.required).toBe(true)
  })

  test("converts boolean field", () => {
    const schema = z.object({ active: z.boolean().describe("Is active") })
    const args = zodToCittyArgs(schema)
    expect(args.active.type).toBe("boolean")
  })

  test("handles optional fields", () => {
    const schema = z.object({ tag: z.string().optional() })
    const args = zodToCittyArgs(schema)
    expect(args.tag.required).toBe(false)
  })

  test("handles default values", () => {
    const schema = z.object({ page: z.number().default(1) })
    const args = zodToCittyArgs(schema)
    expect(args.page.required).toBe(false)
    expect(args.page.default).toBe("1")
  })
})

describe("parseCliInput", () => {
  test("coerces string args to match schema types", () => {
    const schema = z.object({
      name: z.string(),
      price: z.number(),
      active: z.boolean(),
    })
    const raw = { name: "Widget", price: "9.99", active: "true" }
    const result = parseCliInput(schema, raw)
    expect(result).toEqual({ name: "Widget", price: 9.99, active: true })
  })

  test("handles missing optional fields", () => {
    const schema = z.object({
      name: z.string(),
      tag: z.string().optional(),
    })
    const raw = { name: "Widget" }
    const result = parseCliInput(schema, raw)
    expect(result).toEqual({ name: "Widget" })
  })
})
