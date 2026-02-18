import { z } from "zod"
import type { ActionMeta } from "../../src/types"

export const meta: ActionMeta = {
  description: "Create a new todo item",
  auth: "public",
}

export const input = z.object({
  title: z.string().min(1).describe("Todo title"),
  done: z.boolean().default(false).describe("Is completed"),
})

export default async function(ctx: any) {
  return { todo: { id: crypto.randomUUID(), ...ctx.input, createdAt: new Date().toISOString() } }
}
