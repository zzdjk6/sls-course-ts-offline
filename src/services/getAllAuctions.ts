import { IAuctionEntity } from "../models/IAuctionEntity";
import { getDynamodbClient } from "./getDynamodbClient";
import { getAuctionsTableName } from "./getAuctionsTableName";
import { InternalServerError } from "http-errors";

export const getAllAuctions = async (): Promise<IAuctionEntity[]> => {
  try {
    const client = getDynamodbClient();
    const result = await client
      .scan({
        TableName: getAuctionsTableName(),
      })
      .promise();

    return result.Items as IAuctionEntity[];
  } catch (error) {
    console.error(error);
    throw new InternalServerError(error);
  }
};
