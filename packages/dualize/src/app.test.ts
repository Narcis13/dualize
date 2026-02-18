import { describe, test, expect } from "bun:test"
import { resolve } from "path"
import { createDualApp } from "./app"

describe("createDualApp", () => {
  const fixturesDir = resolve(import.meta.dir, "__fixtures__/actions")

  test("creates dual app with hono and cli", async () => {
    const dual = await createDualApp({
      actionsDir: fixturesDir,
      name: "testapp",
      version: "0.1.0",
    })
    expect(dual.hono).toBeDefined()
    expect(dual.cli).toBeDefined()
    expect(dual.registry).toBeDefined()
  })

  test("hono app responds to API requests", async () => {
    const dual = await createDualApp({
      actionsDir: fixturesDir,
      name: "testapp",
    })

    const res = await dual.hono.request("/api/product/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test", price: 5 }),
    })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.product.name).toBe("Test")
  })

  test("cli executes actions", async () => {
    const dual = await createDualApp({
      actionsDir: fixturesDir,
      name: "testapp",
    })

    const result = await dual.cli.execute("product.create", { name: "Test", price: "5" })
    expect(result).toBeDefined()
  })

  test("injects custom context into actions", async () => {
    const myService = { ping: () => "pong" }
    const dual = await createDualApp({
      actionsDir: fixturesDir,
      name: "testapp",
      context: { myService },
    })

    const result = await dual.cli.execute("health", {})
    expect(result).toEqual({ status: "ok" })
  })
})
