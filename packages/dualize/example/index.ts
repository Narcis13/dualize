import { createDualApp } from "../src"
import { resolve } from "path"

const app = await createDualApp({
  actionsDir: resolve(import.meta.dir, "actions"),
  name: "todo-app",
  version: "0.1.0",
})

// If "serve" is the first arg, start the server
const firstArg = process.argv[2]
if (firstArg === "serve") {
  app.serve({ port: 3000 })
} else if (firstArg) {
  // CLI mode
  app.run(process.argv)
} else {
  console.log("Usage:")
  console.log("  bun example/index.ts serve          # Start API server")
  console.log("  bun example/index.ts todo create ... # Run CLI command")
  console.log("  bun example/index.ts --help          # Show help")
}
