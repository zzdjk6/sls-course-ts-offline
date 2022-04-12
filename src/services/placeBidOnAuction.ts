import { IAuctionEntity } from "../models/IAuctionEntity";
import { getAuctionById } from "./getAuctionById";
import { Forbidden, InternalServerError } from "http-errors";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";
import { getAuctionsTableName } from "./getAuctionsTableName";
import { getDynamodbClient } from "./getDynamodbClient";

export const placeBidOnAuction = async (payload: {
  id: string;
  amount: number;
}): Promise<IAuctionEntity> => {
  const { id, amount } = payload;

  const auction = await getAuctionById(id);

  if (amount <= auction.highestBid.amount) {
    throw new Forbidden(
      `Your bid must be higher than ${auction.highestBid.amount}!`
    );
  }

  const params: DocumentClient.UpdateItemInput = {
    TableName: getAuctionsTableName(),
    Key: { id },
    UpdateExpression: "set highestBid.amount = :amount",
    ExpressionAttributeValues: {
      ":amount": amount,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const client = getDynamodbClient();
    const result = await client.update(params).promise();
    return result.Attributes as IAuctionEntity;
  } catch (error) {
    console.error(error);
    throw new InternalServerError(error);
  }
};
