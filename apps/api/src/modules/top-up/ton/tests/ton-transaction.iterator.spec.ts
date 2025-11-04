import { TONTransactionIterator } from "../ton-transaction.iterator"
import { Address, TonClient } from "@ton/ton"
import { uniq, uniqBy } from "lodash"

const address = "UQDjL08aXGQIjXWyJmI6XW_Ce2gEDuKbbUDh0VcCos4N-cY7"
describe.skip("TONTransactionIterator", () => {
  let iterator: TONTransactionIterator

  beforeEach(async () => {
    const provider = new TonClient({
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      apiKey: "cc187e363ec5dd1467ab563c4f4ce0fa55b35b95a7ed30b3b0d14ad510e1d58f",
    })
    iterator = new TONTransactionIterator(provider, Address.parse(address), 8)
  })

  it("should works", async () => {
    let next: number = 0
    let back: number = 0

    let txids: string[] = []

    while (iterator.canNext()) {
      const txs = await iterator.next()
      for (let tx of txs) {
        txids.push(tx.hash().toString("hex"))
      }
      next += 1
    }

    expect(uniq(txids).length).toBe(txids.length)

    txids = []
    while (iterator.canBack()) {
      const txs = await iterator.back()
      for (let tx of txs) {
        txids.push(tx.hash().toString("hex"))
      }
      back += 1
    }

    expect(uniq(txids).length).toBe(txids.length)
    expect(next).toBe(3)
    expect(back).toBe(3)
  })
})
