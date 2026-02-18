import { z } from "zod"
import type { ActionMeta } from "../../../../types"

export const meta: ActionMeta = {
  description: "Get product by ID",
}

export const input = z.object({
  name: z.string().optional(),
})

export default async function(ctx: any) {
  return { product: { id: "test" } }
}
