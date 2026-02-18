import { describe, test, expect } from "bun:test"
import { ActionError } from "./errors"

describe("ActionError", () => {
  test("creates error with code and message", () => {
    const err = new ActionError("NOT_FOUND", "Product not found")
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe("NOT_FOUND")
    expect(err.message).toBe("Product not found")
    expect(err.statusCode).toBe(404)
  })

  test("maps error codes to HTTP status codes", () => {
    expect(new ActionError("NOT_FOUND", "").statusCode).toBe(404)
    expect(new ActionError("FORBIDDEN", "").statusCode).toBe(403)
    expect(new ActionError("VALIDATION", "").statusCode).toBe(400)
    expect(new ActionError("CONFLICT", "").statusCode).toBe(409)
    expect(new ActionError("UNAUTHORIZED", "").statusCode).toBe(401)
    expect(new ActionError("INTERNAL", "").statusCode).toBe(500)
  })

  test("includes optional details", () => {
    const details = { field: "price", issue: "must be positive" }
    const err = new ActionError("VALIDATION", "Invalid input", details)
    expect(err.details).toEqual(details)
  })

  test("toJSON returns structured error", () => {
    const err = new ActionError("NOT_FOUND", "Not found")
    const json = err.toJSON()
    expect(json).toEqual({
      error: { code: "NOT_FOUND", message: "Not found" }
    })
  })
})
