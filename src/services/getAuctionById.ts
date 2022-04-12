import { InternalServerError, NotFound } from "http-errors";
import { getAuctionsTableName } from "./getAuctionsTableName";
import { getDynamodbClient } from "./getDynamodbClient";
import { IAuctionEntity } from "../models/IAuctionEntity";

export const getAuctionById = async (id: string): Promise<IAuctionEntity> => {
  let auction: IAuctionEntity;

  try {
    const client = getDynamodbClient();
    const result = await client
      .get({
        TableName: getAuctionsTableName(),
        Key: { id },
      })
      .promise();

    // TODO: needs parsing and transformation
    auction = result.Item as IAuctionEntity;
  } catch (error) {
    console.error(error);
    throw new InternalServerError(error);
  }

  if (!auction) {
    throw new NotFound(`Auction with ID "${id}" not found!`);
  }

  return auction;
};
