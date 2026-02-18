import type { ActionMeta } from "../../../types"

export const meta: ActionMeta = {
  description: "List all products",
  auth: "public",
}

export default async function() {
  return { products: [] }
}
