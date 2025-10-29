import type { PerformerType } from "../../shared/types"
import userIcon from "../../assets/icons/navigation/user.svg"

export const performersData: PerformerType[] = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    avatar: userIcon,
    position: { lat: 37.758749, lng: -122.461771 },
    lastSeenAt: new Date(),
    rating: 5.0,
  },
  {
    id: 2,
    firstName: "Alice",
    lastName: "Smith",
    avatar: userIcon,
    position: { lat: 37.75254, lng: -122.472629 },
    lastSeenAt: new Date(),
    rating: 4.5,
  },
  {
    id: 3,
    firstName: "Bob",
    lastName: "Johnson",
    avatar: userIcon,
    position: { lat: 37.749859, lng: -122.465076 },
    lastSeenAt: new Date(),
    rating: 3.9,
  },
]
