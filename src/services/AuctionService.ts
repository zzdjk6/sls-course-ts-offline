import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamodbClientProvider } from "./DynamodbClientProvider";
import { IAuctionEntity, IAuctionStatus, IBidEntity } from "../models/IAuctionEntity";
import get from "lodash/get";
import toString from "lodash/toString";
import { toNumber } from "lodash";
import { ulid } from "ulid";

export class AuctionService {
  private readonly tableName: string;
  private dynamodbClient: DocumentClient;

  constructor() {
    this.tableName = process.env.AUCTIONS_TABLE_NAME || "Auctions-offline";
    this.dynamodbClient = DynamodbClientProvider.getDocumentClient();
  }

  async createAuction(payload: { title: string; seller: string }) {
    const { title, seller } = payload;
    const now = new Date();
    const endDate = new Date();
    endDate.setHours(now.getHours() + 1);

    const auction: IAuctionEntity = {
      id: `AUCTION::${seller}::${ulid()}`,
      title,
      status: "OPEN",
      createdAt: now.toISOString(),
      endingAt: endDate.toISOString(),
      highestBid: {
        amount: 0,
        bidder: "",
      },
      seller,
    };

    await this.dynamodbClient
      .put({
        TableName: this.tableName,
        Item: auction,
      })
      .promise();

    return auction;
  }

  async getAllAuctions(params: { status: string }): Promise<IAuctionEntity[]> {
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

    const auctions = result.Items?.map((item) => this.parseAuctionEntity(item)) || [];
    return auctions;
  }

  async getAuctionById(id: string): Promise<IAuctionEntity | null> {
    const result = await this.dynamodbClient
      .get({
        TableName: this.tableName,
        Key: { id },
      })
      .promise();

    if (!result.Item) {
      return null;
    }

    return this.parseAuctionEntity(result.Item);
  }

  async placeBidOnAuction(payload: { id: string; amount: number; bidder: string }): Promise<IAuctionEntity | null> {
    const { id, amount, bidder } = payload;

    const auction = await this.getAuctionById(id);
    if (!auction) {
      return null;
    }

    if (amount <= auction.highestBid.amount) {
      throw new Error(`Your bid must be higher than ${auction.highestBid.amount}!`);
    }

    const params: DocumentClient.UpdateItemInput = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: "SET highestBid = :highestBid",
      ExpressionAttributeValues: {
        ":highestBid": {
          amount,
          bidder,
        },
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await this.dynamodbClient.update(params).promise();
    return this.parseAuctionEntity(result.Attributes);
  }

  private parseAuctionEntity(json: any): IAuctionEntity {
    return {
      id: toString(get(json, "id")),
      title: toString(get(json, "title")),
      status: this.parseAuctionStatus(toString(get(json, "status"))),
      createdAt: toString(get(json, "createdAt")),
      endingAt: toString(get(json, "endingAt")),
      highestBid: this.parseBid(get(json, "highestBid")),
      seller: toString(get(json, "seller")),
    };
  }

  private parseAuctionStatus(str: string): IAuctionStatus {
    if (str.toUpperCase() === "OPEN") {
      return "OPEN";
    }

    return "CLOSED";
  }

  private parseBid(json: any): IBidEntity {
    return {
      amount: toNumber(get(json, "amount")),
      bidder: toString(get(json, "bidder")),
    };
  }
}
