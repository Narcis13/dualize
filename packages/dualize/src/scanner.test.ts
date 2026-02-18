import { describe, test, expect } from "bun:test"
import { resolve } from "path"
import { scanActions, filePathToActionName, actionNameToRoute, inferHttpMethod } from "./scanner"

describe("filePathToActionName", () => {
  test("converts nested path to dot-separated name", () => {
    expect(filePathToActionName("product/create.ts")).toBe("product.create")
  })

  test("handles [param] directories", () => {
    expect(filePathToActionName("product/[id]/get.ts")).toBe("product.get")
  })

  test("handles underscore prefix (no namespace)", () => {
    expect(filePathToActionName("_health.ts")).toBe("health")
  })
})

describe("actionNameToRoute", () => {
  test("converts action name to API route", () => {
    expect(actionNameToRoute("product.create", [])).toBe("/product/create")
  })

  test("includes params in route", () => {
    expect(actionNameToRoute("product.get", ["id"])).toBe("/product/:id")
  })
})

describe("inferHttpMethod", () => {
  test("infers POST for create", () => {
    expect(inferHttpMethod("product.create")).toBe("POST")
  })

  test("infers GET for list", () => {
    expect(inferHttpMethod("product.list")).toBe("GET")
  })

  test("infers GET for get", () => {
    expect(inferHttpMethod("product.get")).toBe("GET")
  })

  test("infers PATCH for update", () => {
    expect(inferHttpMethod("product.update")).toBe("PATCH")
  })

  test("infers DELETE for delete", () => {
    expect(inferHttpMethod("product.delete")).toBe("DELETE")
  })

  test("defaults to POST for unknown", () => {
    expect(inferHttpMethod("product.export")).toBe("POST")
  })
})

describe("scanActions", () => {
  const fixturesDir = resolve(import.meta.dir, "__fixtures__/actions")

  test("discovers all action files", async () => {
    const registry = await scanActions(fixturesDir)
    const names = [...registry.keys()].sort()
    expect(names).toContain("product.create")
    expect(names).toContain("product.list")
    expect(names).toContain("product.get")
    expect(names).toContain("health")
  })

  test("loads action with input schema", async () => {
    const registry = await scanActions(fixturesDir)
    const action = registry.get("product.create")!
    expect(action.meta.description).toBe("Create a new product")
    expect(action.input).not.toBeNull()
    expect(action.handler).toBeFunction()
  })

  test("loads action without input schema", async () => {
    const registry = await scanActions(fixturesDir)
    const action = registry.get("product.list")!
    expect(action.input).toBeNull()
  })

  test("extracts params from [param] dirs", async () => {
    const registry = await scanActions(fixturesDir)
    const action = registry.get("product.get")!
    expect(action.params).toEqual(["id"])
  })

  test("handles underscore prefix files", async () => {
    const registry = await scanActions(fixturesDir)
    const action = registry.get("health")!
    expect(action.meta.description).toBe("Health check")
  })
})
