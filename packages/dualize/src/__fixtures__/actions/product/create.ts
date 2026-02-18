import { z } from "zod"
import type { ActionMeta } from "../../../types"

export const meta: ActionMeta = {
  description: "Create a new product",
  auth: "admin",
}

export const input = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
})

export default async function(ctx: any) {
  return { product: { id: "123", ...ctx.input } }
}
