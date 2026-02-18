import { describe, test, expect, mock } from "bun:test"
import { resolve } from "path"
import { scanActions } from "./scanner"
import { createCLIAdapter } from "./cli-adapter"

describe("createCLIAdapter", () => {
  const fixturesDir = resolve(import.meta.dir, "__fixtures__/actions")

  test("builds command tree from registry", async () => {
    const registry = await scanActions(fixturesDir)
    const cli = createCLIAdapter(registry, { name: "testapp", version: "0.1.0" })
    expect(cli).toBeDefined()
    expect(cli.run).toBeFunction()
  })

  test("generates help text", async () => {
    const registry = await scanActions(fixturesDir)
    const cli = createCLIAdapter(registry, { name: "testapp", version: "0.1.0" })
    const help = cli.getHelp()
    expect(help).toContain("testapp")
    expect(help).toContain("product create")
    expect(help).toContain("product list")
    expect(help).toContain("health")
  })

  test("generates action-specific help", async () => {
    const registry = await scanActions(fixturesDir)
    const cli = createCLIAdapter(registry, { name: "testapp", version: "0.1.0" })
    const help = cli.getActionHelp("product.create")
    expect(help).toContain("Create a new product")
    expect(help).toContain("--name")
    expect(help).toContain("--price")
  })

  test("executes action from parsed args", async () => {
    const registry = await scanActions(fixturesDir)
    const cli = createCLIAdapter(registry, { name: "testapp", version: "0.1.0" })
    const result = await cli.execute("product.create", { name: "Widget", price: "9.99" })
    expect(result).toEqual({ product: { id: "123", name: "Widget", price: 9.99 } })
  })

  test("returns validation error for invalid input", async () => {
    const registry = await scanActions(fixturesDir)
    const cli = createCLIAdapter(registry, { name: "testapp", version: "0.1.0" })
    try {
      await cli.execute("product.create", { name: "", price: "-1" })
      expect(true).toBe(false) // should not reach here
    } catch (err: any) {
      expect(err.code).toBe("VALIDATION")
    }
  })
})
