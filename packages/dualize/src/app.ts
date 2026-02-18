import { Hono } from "hono"
import type { DualAppOptions, LoadedAction } from "./types"
import { scanActions } from "./scanner"
import { createHonoAdapter } from "./hono-adapter"
import { createCLIAdapter } from "./cli-adapter"

export async function createDualApp(options: DualAppOptions) {
  const {
    actionsDir,
    name,
    version = "0.0.0",
    context: customContext = {},
    authResolver,
    apiPrefix = "/api",
  } = options

  // Scan actions
  const registry = await scanActions(actionsDir)

  // Build Hono app
  const hono = new Hono()
  const honoAdapter = createHonoAdapter(registry, {
    prefix: apiPrefix,
    authResolver,
    context: customContext,
  })
  honoAdapter.mount(hono)

  // Build CLI
  const cli = createCLIAdapter(registry, {
    name,
    version,
    authResolver,
    context: customContext,
  })

  return {
    hono,
    cli,
    registry,

    serve(opts: { port?: number } = {}) {
      const port = opts.port ?? 3000
      console.log(`${name} v${version} listening on http://localhost:${port}`)
      return Bun.serve({ fetch: hono.fetch, port })
    },

    run(argv: string[]) {
      return cli.run(argv)
    },
  }
}
