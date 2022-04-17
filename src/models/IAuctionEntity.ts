export type IAuctionEntity = {
  /** Generic Dynamodb key fields */
  PK: string; // e.g., AUCTION::01G0RZQ03E1WGABJZ9EFKKS99H
  SK: string; // same as endingAt
  GSI1PK: string; // same as status
  GSI1SK: string; // same as endingAt

  /** Dynamic attributes */
  id: string; // e.g., 01G0RZQ03E1WGABJZ9EFKKS99H
  title: string;
  status: IAuctionStatus;
  createdAt: string;
  endingAt: string;
  highestBid: IBidEntity;
  seller: string; // e.g., example@email.com

  /** This can be used for migrating data structure */
  version: string; // 2022-04-17
};

export type IAuctionStatus = "OPEN" | "CLOSED";

export type IBidEntity = {
  amount: number;
  bidder: string; // e.g., example@email.com
};
