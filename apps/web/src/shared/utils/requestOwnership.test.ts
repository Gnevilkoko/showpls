import { describe, expect, it } from "vitest"
import { isRequestOwnedByUser } from "./requestOwnership"

describe("isRequestOwnedByUser", () => {
  it("returns true when request customer id equals current user id", () => {
    expect(isRequestOwnedByUser({ customer: { id: "42" } }, 42)).toBe(true)
  })

  it("returns false when request belongs to another user", () => {
    expect(isRequestOwnedByUser({ customer: { id: "42" } }, "7")).toBe(false)
  })

  it("returns false when request has no customer id", () => {
    expect(isRequestOwnedByUser({ customer: {} }, "42")).toBe(false)
    expect(isRequestOwnedByUser({}, "42")).toBe(false)
  })

  it("returns false when current user is missing", () => {
    expect(isRequestOwnedByUser({ customer: { id: "42" } }, undefined)).toBe(false)
  })
})
