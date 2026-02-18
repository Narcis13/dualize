import type { ActionMeta } from "../../types"

export const meta: ActionMeta = {
  description: "Health check",
  auth: "public",
}

export default async function() {
  return { status: "ok" }
}
