import { OrderStatus } from "../types/order.ts";

const ORDER_ITEM = {
  id: "5aa9c54c-3a2f-4215-93c6-f98554bc9933",
  status: "delivered",
  totalPrice: "497.7",
  vatPercentage: "5",
  discountAmount: "20",
  createdAt: "2025-02-26T04:04:52.310Z",
  updatedAt: "2025-02-26T04:06:49.652Z",
  orderItems: [
    {
      id: "26bb78de-6b27-4cf9-90c9-3913f9e218bc",
      quantity: 2,
      pricePerItem: "247",
      totalPrice: "494",
      createdAt: "2025-02-26T04:04:52.310Z",
      updatedAt: "2025-02-26T04:04:52.310Z",
      dish: {
        id: "878cbb5a-e121-460b-b6fc-f80893832e3e",
        name: "Spaghetti Bolognese",
        description:
          "A rich and hearty Italian dish, spaghetti served with a flavorful meat-based sauce, garnished with Parmesan cheese.",
        price: "247",
        image:
          "https://tse1.mm.bing.net/th?id=OIP.LAsdwjoPauajduX_sJmM1QHaJq&pid=Api",
        category: "Main",
        isActive: true,
        additionalItem: "Vegetables",
      },
    },
  ],
};

const ORDER = {
  id: "1",
  status: OrderStatus.Pending,
  totalPrice: 0,
  vatPercentage: 0,
  discountAmount: 0,
  orderItems: [ORDER_ITEM],
  createdAt: "2023-01-01",
  updatedAt: "2023-01-02",
};

const ORDER_REQUEST = {
  params: { userId: "1" },
  body: {
    id: "1",
    status: OrderStatus.Delivered,
    totalPrice: 0,
    vatPercentage: 0,
    discountAmount: 0,
    user: { id: "1" },
    orderItems: [],
    cart: { id: "1" },
  },
  query: {
    page: "1",
    limit: "10",
    status: "pending",
  },
};

export { ORDER, ORDER_REQUEST };
