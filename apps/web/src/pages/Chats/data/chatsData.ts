import type { ChatsDataType, ChatType } from "../../../shared/types"
import { TasksList } from "../../Tasks/tasks"
import showplsAgentIcon from "../../../assets/images/logo-without-text.svg"

export const chatList: ChatType[] = [
  {
    chat_id: 0,
    avatar: showplsAgentIcon,
    first_name: "Showpls",
    last_name: "Agent",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 2,
    avatar: null,
    first_name: "Name no surname",
    last_name: null,
    last_message: "Lorem ipsum dolor sit amet consectetur",
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: true,
    orders: [
      {
        order: TasksList[0],
        escrowStatus: "locked",
      },
      {
        order: TasksList[1],
        escrowStatus: "locked",
      },
    ],
    count_unread: 1,
    is_read: false,
  },
  {
    chat_id: 8,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    count_unread: 4,
    is_read: false,
  },
  {
    chat_id: 3,
    avatar: "https://t.me/i/userpic/320/q4sKbvOxAfs1GzG1BvCxGsS2dLs62WaTHYUrqguxs_M.svg",
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 4,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message: "Lorem ipsum dolor sit amet consectetur",
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: true,
    orders: [
      {
        order: TasksList[1],
        escrowStatus: "released",
      },
    ],
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 5,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: true,
    orders: [
      {
        order: TasksList[2],
        escrowStatus: "rejected",
      },
    ],
    count_unread: 15,
    is_read: false,
  },
  {
    chat_id: 6,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 7,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 9,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
  {
    chat_id: 10,
    avatar: null,
    first_name: "Name",
    last_name: "Surname",
    last_message:
      "Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.",
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    orders: null,
    is_read: true,
    count_unread: null,
  },
]

export const chatsData: ChatsDataType = {
  count_unread: 3,
  count_unread_favorite: 1,
  chat_list: chatList,
}
