import { v4 as uuid } from "uuid";
import { getAuctionsTableName } from "./getAuctionsTableName";
import { InternalServerError } from "http-errors";
import { getDynamodbClient } from "./getDynamodbClient";
import { IAuctionEntity } from "../models/IAuctionEntity";

export const createAuction = async (payload: { title: string }) => {
  const auction: IAuctionEntity = {
    id: uuid(),
    title: payload.title,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    highestBid: {
      amount: 0,
    },
  };

  try {
    const client = getDynamodbClient();
    await client
      .put({
        TableName: getAuctionsTableName(),
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new InternalServerError(error);
  }
  return auction;
};
