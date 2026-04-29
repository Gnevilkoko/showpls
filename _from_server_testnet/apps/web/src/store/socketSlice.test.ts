import { describe, it, expect } from "vitest"
import socketReducer, {
  setConnecting,
  setConnected,
  setDisconnected,
  setReconnectAttempt,
  setError,
  resetSocketState,
} from "./socketSlice"
import type { SocketState } from "./socketSlice"

describe("socketSlice", () => {
  const initialState: SocketState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
    socketId: null,
  }

  it("should return initial state", () => {
    expect(socketReducer(undefined, { type: "unknown" })).toEqual(initialState)
  })

  describe("setConnecting", () => {
    it("should set isConnecting to true", () => {
      const action = setConnecting(true)
      const state = socketReducer(initialState, action)
      expect(state.isConnecting).toBe(true)
    })

    it("should set isConnecting to false", () => {
      const action = setConnecting(false)
      const state = socketReducer(initialState, action)
      expect(state.isConnecting).toBe(false)
    })
  })

  describe("setConnected", () => {
    it("should set connected state with socketId", () => {
      const socketId = "test-socket-id-123"
      const action = setConnected({ socketId })
      const state = socketReducer(initialState, action)

      expect(state.isConnected).toBe(true)
      expect(state.isConnecting).toBe(false)
      expect(state.socketId).toBe(socketId)
      expect(state.reconnectAttempts).toBe(0)
      expect(state.lastError).toBe(null)
    })
  })

  describe("setDisconnected", () => {
    it("should reset connection state", () => {
      const connectedState: SocketState = {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 5,
        lastError: null,
        socketId: "test-socket-id",
      }

      const action = setDisconnected()
      const state = socketReducer(connectedState, action)

      expect(state.isConnected).toBe(false)
      expect(state.isConnecting).toBe(false)
      expect(state.socketId).toBe(null)
    })
  })

  describe("setReconnectAttempt", () => {
    it("should update reconnectAttempts", () => {
      const action = setReconnectAttempt(3)
      const state = socketReducer(initialState, action)
      expect(state.reconnectAttempts).toBe(3)
    })
  })

  describe("setError", () => {
    it("should set error message", () => {
      const errorMessage = "Connection failed"
      const action = setError(errorMessage)
      const state = socketReducer(initialState, action)
      expect(state.lastError).toBe(errorMessage)
    })

    it("should clear error when set to null", () => {
      const stateWithError: SocketState = {
        ...initialState,
        lastError: "Previous error",
      }
      const action = setError(null)
      const state = socketReducer(stateWithError, action)
      expect(state.lastError).toBe(null)
    })
  })

  describe("resetSocketState", () => {
    it("should reset to initial state", () => {
      const stateWithData: SocketState = {
        isConnected: true,
        isConnecting: true,
        reconnectAttempts: 5,
        lastError: "Error",
        socketId: "test-id",
      }

      const action = resetSocketState()
      const state = socketReducer(stateWithData, action)

      expect(state).toEqual(initialState)
    })
  })
})
