import type { ActionMeta } from "../../src/types"

export const meta: ActionMeta = {
  description: "List all todos",
  auth: "public",
}

export default async function() {
  return { todos: [{ id: "1", title: "Try dualize", done: false }] }
}
