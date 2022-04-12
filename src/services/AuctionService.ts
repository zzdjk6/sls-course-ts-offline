import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamodbClientProvider } from "./DynamodbClientProvider";
import { IAuctionEntity } from "../models/IAuctionEntity";
import { v4 as uuid } from "uuid";
import createHttpError from "http-errors";

export class AuctionService {
  private readonly tableName: string;
  private dynamodbClient: DocumentClient;

  constructor() {
    this.tableName = AuctionService.getAuctionsTableName();
    this.dynamodbClient = DynamodbClientProvider.getDocumentClient();
  }

  async createAuction(payload: { title: string }) {
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(now.getHours() + 1);

    const auction: IAuctionEntity = {
      id: uuid(),
      title: payload.title,
      status: "OPEN",
      createdAt: now.toISOString(),
      endingAt: endDate.toISOString(),
      highestBid: {
        amount: 0,
      },
    };

    try {
      await this.dynamodbClient
        .put({
          TableName: this.tableName,
          Item: auction,
        })
        .promise();
    } catch (error) {
      console.error(error);
      throw new createHttpError.BadRequest(error);
    }
    return auction;
  }

  async getAllAuctions(params: { status: string }): Promise<IAuctionEntity[]> {
    try {
      const result = await this.dynamodbClient
        .query({
          TableName: this.tableName,
          IndexName: "statusAndEndDate",
          KeyConditionExpression: "#status = :status",
          ExpressionAttributeValues: {
            ":status": params.status,
          },
          ExpressionAttributeNames: {
            "#status": "status",
          },
        })
        .promise();

      // TODO: needs parsing and transformation
      return result.Items as IAuctionEntity[];
    } catch (error) {
      console.error(error);
      throw new createHttpError.BadRequest(error);
    }
  }

  async getAuctionById(id: string): Promise<IAuctionEntity> {
    let auction: IAuctionEntity;

    try {
      const result = await this.dynamodbClient
        .get({
          TableName: this.tableName,
          Key: { id },
        })
        .promise();

      // TODO: needs parsing and transformation
      auction = result.Item as IAuctionEntity;
    } catch (error) {
      console.error(error);
      throw new createHttpError.BadRequest(error);
    }

    if (!auction) {
      throw new createHttpError.NotFound(`Auction with ID "${id}" not found!`);
    }

    return auction;
  }

  async placeBidOnAuction(payload: {
    id: string;
    amount: number;
  }): Promise<IAuctionEntity> {
    const { id, amount } = payload;

    const auction = await this.getAuctionById(id);

    if (amount <= auction.highestBid.amount) {
      throw new createHttpError.Forbidden(
        `Your bid must be higher than ${auction.highestBid.amount}!`
      );
    }

    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: "set highestBid.amount = :amount",
      ExpressionAttributeValues: {
        ":amount": amount,
      },
      ReturnValues: "ALL_NEW",
    };

    try {
      const result = await this.dynamodbClient.update(params).promise();

      // TODO: needs parsing and transformation
      return result.Attributes as IAuctionEntity;
    } catch (error) {
      console.error(error);
      throw new createHttpError.BadRequest(error);
    }
  }

  private static getAuctionsTableName(): string {
    if (process.env.AUCTIONS_TABLE_NAME) {
      return process.env.AUCTIONS_TABLE_NAME;
    }

    return "auctions-offline";
  }
}
