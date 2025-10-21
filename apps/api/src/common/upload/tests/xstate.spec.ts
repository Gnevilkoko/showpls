import { assign, createActor, createMachine } from "xstate"

describe(`XState`, () => {
  it("should work", async () => {
    const toggleMachine = createMachine({
      id: "toggle",
      initial: "inactive",
      context: {
        count: 1,
      } as {
        count: number
      },

      states: {
        inactive: {
          on: {
            TOGGLE: { target: "active" },
          },
        },
        active: {
          // entry: assign({ count: ({ context }) => context.count + 1 }),

          on: {
            TOGGLE: {
              target: "inactive",
              actions: [
                assign(({ context, event }) => {
                  console.log(context)
                  return context
                }),
              ],
            },
            STOP: {
              target: "stopped",
              guard: ({ context, event }) => {
                console.log(event, "event")
                return true
                // return context.count > 0
              },
              actions: [
                assign(({ context, event }) => {
                  console.log(context, event, "stopped")
                  context.count += event.value
                  return context
                }),
              ],
            },
          },
        },
        stopped: {
          type: "final",
        },
      },
    })

    const actor = createActor(toggleMachine, {
      // snapshot: {
      //   status: "active",
      //   output: undefined,
      //   error: undefined,
      //   value: "active",
      //   historyValue: {},
      //   context: { count: 3 },
      //   children: {}
      // } as any
    })

    actor.subscribe((state) => {
      // persistance
      const snapshot = actor.getPersistedSnapshot()
      console.log(snapshot)
      // save
    })

    actor.subscribe({
      next: (_) => {
        const snapshot = actor.getPersistedSnapshot()
      },
      error: (e) => {
        console.error(e)
      },
      complete: () => {
        console.log("finish")
      },
    })

    actor.start()

    for (let i = 0; i < 5; i++) {
      actor.send({ type: "TOGGLE" })
    }

    // console.log(actor.getPersistedSnapshot())

    actor.send({ type: "STOP", value: 555 })

    console.log(actor.getPersistedSnapshot(), "state")

    actor.stop()
  })
})
