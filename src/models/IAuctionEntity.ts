export type IAuctionEntity = {
  id: string;
  title: string;
  status: IAuctionStatus;
  createdAt: string;
  endingAt: string;
  highestBid: IBidEntity;
  seller: string;
};

export type IAuctionStatus = "OPEN" | "CLOSED";

export type IBidEntity = {
  amount: number;
  bidder: string;
};
