import type { TransactionType } from "../../../shared/types"

export const walletTransactionList: TransactionType[] = [
  {
    id: "1",
    type: "founded",
    stars: 200,
    status: "verified",
    isStars: true,
    date: new Date().toISOString(),
  },
  {
    id: "2",
    type: "escrowHold",
    stars: 120,
    status: "hold",
    isStars: true,
    date: new Date().toISOString(),
  },
  {
    id: "3",
    type: "releasedExecutor",
    status: "verified",
    isStars: false,
    date: new Date().toISOString(),
  },
  {
    id: "4",
    type: "refundedCustomer",
    status: "verified",
    isStars: false,
    date: new Date().toISOString(),
  },
  {
    id: "5",
    type: "founded",
    stars: 200,
    status: "verified",
    isStars: true,
    date: new Date().toISOString(),
  },
  {
    id: "6",
    type: "escrowHold",
    stars: 120,
    status: "hold",
    isStars: true,
    date: new Date().toISOString(),
  },
]
