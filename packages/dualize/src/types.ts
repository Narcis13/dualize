import type { z } from "zod"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ActionMeta {
  description: string
  auth?: "public" | "admin" | "user" | ((ctx: AuthContext) => boolean | Promise<boolean>)
  api?: {
    method?: HttpMethod
    path?: string
  } | false
  cli?: {
    name?: string
  } | false
}

export interface AuthContext {
  userId: string
  role: string
  [key: string]: unknown
}

export interface ActionContext<TInput = unknown, TCustom = Record<string, unknown>> {
  input: TInput
  auth: AuthContext | null
  meta: ActionMeta
  source: "api" | "cli"
}

export type ActionHandler<TInput = unknown> = (
  ctx: ActionContext<TInput> & Record<string, unknown>
) => unknown | Promise<unknown>

export type AuthResolver = (
  source: "api" | "cli",
  raw: unknown
) => Promise<AuthContext | null>

export interface LoadedAction {
  name: string
  meta: ActionMeta
  input: z.ZodObject<any> | null
  handler: ActionHandler
  filePath: string
  params: string[]
}

export interface DualAppOptions {
  actionsDir: string
  name: string
  version?: string
  context?: Record<string, unknown>
  authResolver?: AuthResolver
  apiPrefix?: string
}
