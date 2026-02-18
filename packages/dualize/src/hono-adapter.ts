import type { Hono, Context } from "hono"
import type { LoadedAction, AuthResolver, HttpMethod } from "./types"
import { ActionError } from "./errors"
import { inferHttpMethod, actionNameToRoute } from "./scanner"

interface HonoAdapterOptions {
  prefix?: string
  authResolver?: AuthResolver
  context?: Record<string, unknown>
}

export function createHonoAdapter(
  registry: Map<string, LoadedAction>,
  options: HonoAdapterOptions = {}
) {
  const { prefix = "", authResolver, context: customContext = {} } = options

  function mount(app: Hono) {
    for (const [, action] of registry) {
      if (action.meta.api === false) continue

      const method = action.meta.api?.method ?? inferHttpMethod(action.name)
      const route = action.meta.api?.path ?? actionNameToRoute(action.name, action.params)
      const fullRoute = prefix + route

      app.on(method, fullRoute, async (c: Context) => {
        try {
          let rawInput: Record<string, unknown> = {}
          if (method === "GET") {
            const url = new URL(c.req.url)
            for (const [key, value] of url.searchParams) {
              rawInput[key] = value
            }
          } else {
            try {
              rawInput = await c.req.json()
            } catch {
              rawInput = {}
            }
          }

          if (action.params.length > 0) {
            for (const param of action.params) {
              rawInput[param] = c.req.param(param)
            }
          }

          let validatedInput = rawInput
          if (action.input) {
            const result = action.input.safeParse(rawInput)
            if (!result.success) {
              throw new ActionError("VALIDATION", "Invalid input", result.error.flatten())
            }
            validatedInput = result.data
          }

          let auth = null
          if (authResolver) {
            auth = await authResolver("api", c)
          }

          if (authResolver && action.meta.auth === "admin" && (!auth || auth.role !== "admin")) {
            throw new ActionError("FORBIDDEN", "Admin access required")
          }

          const ctx = {
            input: validatedInput,
            auth,
            meta: action.meta,
            source: "api" as const,
            ...customContext,
          }

          const result = await action.handler(ctx)
          return c.json(result)
        } catch (err) {
          if (err instanceof ActionError) {
            return c.json(err.toJSON(), err.statusCode as any)
          }
          console.error(`Action ${action.name} error:`, err)
          const internal = new ActionError("INTERNAL", "Internal server error")
          return c.json(internal.toJSON(), 500)
        }
      })
    }
  }

  return { mount }
}
