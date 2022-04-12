export type IAuctionEntity = {
  id: string;
  title: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  highestBid: {
    amount: number;
  };
};
