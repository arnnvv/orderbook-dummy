interface Order {
  price: number;
  quantity: number;
  orderId: string;
}

interface Bid extends Order {
  side: "bid";
}

interface Ask extends Order {
  side: "ask";
}

interface Orderbook {
  bids: Bid[];
  asks: Ask[];
}

interface Fill {
  price: number;
  qty: number;
  tradeId: number;
}
