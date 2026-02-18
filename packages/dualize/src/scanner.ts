import { resolve } from "path"
import type { LoadedAction, HttpMethod } from "./types"

const METHOD_MAP: Record<string, HttpMethod> = {
  create: "POST",
  list: "GET",
  get: "GET",
  update: "PATCH",
  delete: "DELETE",
}

export function inferHttpMethod(actionName: string): HttpMethod {
  const lastPart = actionName.split(".").pop() ?? ""
  return METHOD_MAP[lastPart] ?? "POST"
}

export function filePathToActionName(filePath: string): string {
  const withoutExt = filePath.replace(/\.ts$/, "")
  const parts = withoutExt.split("/")
  const nameParts: string[] = []
  for (const part of parts) {
    if (part.startsWith("[") && part.endsWith("]")) continue
    if (part.startsWith("_")) {
      nameParts.push(part.slice(1))
    } else {
      nameParts.push(part)
    }
  }
  return nameParts.join(".")
}

export function actionNameToRoute(actionName: string, params: string[]): string {
  const parts = actionName.split(".")
  if (params.length > 0) {
    // When params exist, the verb (last part) is conveyed by the HTTP method,
    // so drop it and append params instead. e.g. product.get + [id] → /product/:id
    const namespace = parts.slice(0, -1)
    const paramSegments = params.map(p => ":" + p)
    return "/" + [...namespace, ...paramSegments].join("/")
  }
  return "/" + parts.join("/")
}

function extractParams(filePath: string): string[] {
  const params: string[] = []
  const parts = filePath.split("/")
  for (const part of parts) {
    const match = part.match(/^\[(.+)\]$/)
    if (match) params.push(match[1])
  }
  return params
}

export async function scanActions(dir: string): Promise<Map<string, LoadedAction>> {
  const registry = new Map<string, LoadedAction>()
  const glob = new Bun.Glob("**/*.ts")

  for await (const file of glob.scan({ cwd: dir, onlyFiles: true })) {
    if (file.includes(".test.") || file.includes(".spec.")) continue

    const fullPath = resolve(dir, file)
    const mod = await import(fullPath)

    if (!mod.default || typeof mod.default !== "function") {
      throw new Error(`Action file ${file} must have a default export (handler function)`)
    }
    if (!mod.meta || typeof mod.meta.description !== "string") {
      throw new Error(`Action file ${file} must export a 'meta' object with 'description'`)
    }

    const name = filePathToActionName(file)
    const params = extractParams(file)

    registry.set(name, {
      name,
      meta: mod.meta,
      input: mod.input ?? null,
      handler: mod.default,
      filePath: file,
      params,
    })
  }

  return registry
}
