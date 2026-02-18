import { describe, test, expect } from "bun:test"
import { z } from "zod"
import type { ActionMeta, ActionContext, AuthResolver, LoadedAction } from "./types"

describe("types", () => {
  test("ActionMeta accepts minimal config", () => {
    const meta: ActionMeta = { description: "Test action" }
    expect(meta.description).toBe("Test action")
  })

  test("ActionMeta accepts full config with overrides", () => {
    const meta: ActionMeta = {
      description: "Create product",
      auth: "admin",
      api: { method: "PUT", path: "/custom" },
      cli: false,
    }
    expect(meta.auth).toBe("admin")
    expect(meta.api?.method).toBe("PUT")
    expect(meta.cli).toBe(false)
  })

  test("LoadedAction contains all required fields", () => {
    const schema = z.object({ name: z.string() })
    const action: LoadedAction = {
      name: "product.create",
      meta: { description: "Create" },
      input: schema,
      handler: async (ctx) => ({ ok: true }),
      filePath: "actions/product/create.ts",
      params: [],
    }
    expect(action.name).toBe("product.create")
    expect(action.params).toEqual([])
  })
})
