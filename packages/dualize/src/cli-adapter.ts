import type { LoadedAction, AuthResolver } from "./types"
import { ActionError } from "./errors"
import { zodToCittyArgs, parseCliInput } from "./zod-bridge"

interface CLIAdapterOptions {
  name: string
  version?: string
  authResolver?: AuthResolver
  context?: Record<string, unknown>
}

export function createCLIAdapter(
  registry: Map<string, LoadedAction>,
  options: CLIAdapterOptions
) {
  const { name, version = "0.0.0", authResolver, context: customContext = {} } = options

  function getHelp(): string {
    const lines = [`${name} v${version}`, "", "Commands:"]
    const actions = [...registry.values()]
      .filter(a => a.meta.cli !== false)
      .sort((a, b) => a.name.localeCompare(b.name))

    for (const action of actions) {
      const cmd = action.name.replace(/\./g, " ")
      lines.push(`  ${cmd.padEnd(24)} ${action.meta.description}`)
    }
    return lines.join("\n")
  }

  function getActionHelp(actionName: string): string {
    const action = registry.get(actionName)
    if (!action) return `Unknown action: ${actionName}`

    const lines = [action.meta.description, ""]
    const cmd = action.name.replace(/\./g, " ")
    lines.push(`Usage: ${name} ${cmd} [options]`, "")

    if (action.input) {
      lines.push("Options:")
      const args = zodToCittyArgs(action.input)
      for (const [key, arg] of Object.entries(args)) {
        const req = arg.required ? "(required)" : `(default: ${arg.default ?? "none"})`
        lines.push(`  --${key.padEnd(16)} ${arg.type.padEnd(10)} ${req}  ${arg.description}`)
      }
    }

    if (action.meta.auth && action.meta.auth !== "public") {
      lines.push("", `Auth: ${typeof action.meta.auth === "string" ? action.meta.auth : "custom"}`)
    }

    return lines.join("\n")
  }

  async function execute(actionName: string, rawArgs: Record<string, unknown>): Promise<unknown> {
    const action = registry.get(actionName)
    if (!action) throw new ActionError("NOT_FOUND", `Unknown action: ${actionName}`)

    // Coerce and validate input
    let validatedInput: Record<string, unknown> = rawArgs
    if (action.input) {
      const coerced = parseCliInput(action.input, rawArgs)
      const result = action.input.safeParse(coerced)
      if (!result.success) {
        throw new ActionError("VALIDATION", "Invalid input", result.error.flatten())
      }
      validatedInput = result.data
    }

    // Resolve auth
    let auth = null
    if (authResolver) {
      auth = await authResolver("cli", null)
    }

    // Build context
    const ctx = {
      input: validatedInput,
      auth,
      meta: action.meta,
      source: "cli" as const,
      ...customContext,
    }

    return action.handler(ctx)
  }

  function parseArgs(argv: string[]): { actionName: string | null; args: Record<string, unknown>; flags: { help: boolean; pretty: boolean } } {
    const args: Record<string, unknown> = {}
    const parts: string[] = []
    let help = false
    let pretty = false

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]
      if (arg === "--help" || arg === "-h") {
        help = true
      } else if (arg === "--pretty") {
        pretty = true
      } else if (arg.startsWith("--")) {
        const key = arg.slice(2)
        const next = argv[i + 1]
        if (next && !next.startsWith("--")) {
          args[key] = next
          i++
        } else {
          args[key] = "true"
        }
      } else {
        parts.push(arg)
      }
    }

    // Try to match action name: "product create" -> "product.create"
    let actionName: string | null = null
    if (parts.length >= 2) {
      actionName = parts.slice(0, 2).join(".")
      if (!registry.has(actionName) && parts.length >= 1) {
        actionName = parts[0]
      }
    } else if (parts.length === 1) {
      actionName = parts[0]
    }

    return { actionName, args, flags: { help, pretty } }
  }

  async function run(argv: string[]): Promise<void> {
    // Strip node/bun binary and script path
    const userArgs = argv.slice(2)

    if (userArgs.length === 0 || userArgs[0] === "--help" || userArgs[0] === "-h") {
      console.log(getHelp())
      return
    }

    // Built-in "actions" meta-command
    if (userArgs[0] === "actions") {
      const actions = [...registry.values()]
        .filter(a => a.meta.cli !== false)
        .map(a => ({ name: a.name, description: a.meta.description, auth: a.meta.auth ?? "public" }))
      console.log(JSON.stringify(actions, null, 2))
      return
    }

    const { actionName, args, flags } = parseArgs(userArgs)

    if (!actionName || !registry.has(actionName)) {
      console.error(`Unknown command: ${userArgs.join(" ")}`)
      console.error(`Run '${name} --help' for available commands.`)
      process.exit(1)
    }

    if (flags.help) {
      console.log(getActionHelp(actionName))
      return
    }

    try {
      const result = await execute(actionName, args)
      const output = flags.pretty
        ? JSON.stringify(result, null, 2)
        : JSON.stringify(result)
      console.log(output)
    } catch (err) {
      if (err instanceof ActionError) {
        console.error(JSON.stringify(err.toJSON()))
        process.exit(1)
      }
      throw err
    }
  }

  return { run, execute, getHelp, getActionHelp, parseArgs }
}
