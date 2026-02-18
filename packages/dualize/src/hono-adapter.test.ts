import { describe, test, expect } from "bun:test"
import { resolve } from "path"
import { Hono } from "hono"
import { scanActions } from "./scanner"
import { createHonoAdapter } from "./hono-adapter"

describe("createHonoAdapter", () => {
  const fixturesDir = resolve(import.meta.dir, "__fixtures__/actions")

  test("mounts routes on Hono app", async () => {
    const registry = await scanActions(fixturesDir)
    const app = new Hono()
    const adapter = createHonoAdapter(registry, { prefix: "/api" })
    adapter.mount(app)

    const res = await app.request("/api/product/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Widget", price: 9.99 }),
    })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.product.name).toBe("Widget")
  })

  test("GET routes work", async () => {
    const registry = await scanActions(fixturesDir)
    const app = new Hono()
    const adapter = createHonoAdapter(registry)
    adapter.mount(app)

    const res = await app.request("/product/list", { method: "GET" })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.products).toEqual([])
  })

  test("returns 400 on validation error", async () => {
    const registry = await scanActions(fixturesDir)
    const app = new Hono()
    const adapter = createHonoAdapter(registry, { prefix: "/api" })
    adapter.mount(app)

    const res = await app.request("/api/product/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", price: -1 }),
    })
    expect(res.status).toBe(400)
    const json = await res.json() as any
    expect(json.error.code).toBe("VALIDATION")
  })

  test("handles ActionError from handler", async () => {
    const registry = await scanActions(fixturesDir)
    const app = new Hono()
    const adapter = createHonoAdapter(registry)
    adapter.mount(app)

    const res = await app.request("/health", { method: "POST" })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.status).toBe("ok")
  })

  test("routes with params work", async () => {
    const registry = await scanActions(fixturesDir)
    const app = new Hono()
    const adapter = createHonoAdapter(registry)
    adapter.mount(app)

    const res = await app.request("/product/abc123", { method: "GET" })
    expect(res.status).toBe(200)
  })
})
