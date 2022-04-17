import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { DynamodbClientProvider } from "./DynamodbClientProvider";
import { IAuctionEntity, IAuctionStatus, IBidEntity } from "../models/IAuctionEntity";
import get from "lodash/get";
import toString from "lodash/toString";
import { toNumber } from "lodash";
import { ulid } from "ulid";

/**
 * Service class to perform business logic about Auction
 * Note: all methods can throw
 */
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

    const id = ulid();

    const auction: IAuctionEntity = {
      PK: this.generateAuctionPK(id),
      SK: endDate.toISOString(),
      GSI1PK: "OPEN",
      GSI1SK: endDate.toISOString(),
      id,
      title,
      status: "OPEN",
      createdAt: now.toISOString(),
      endingAt: endDate.toISOString(),
      highestBid: {
        amount: 0,
        bidder: "",
      },
      seller,
      version: "2022-04-17",
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
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :GSI1PK",
        ExpressionAttributeValues: {
          ":GSI1PK": params.status,
        },
        ScanIndexForward: false, // DESC
      })
      .promise();

    const auctions = result.Items?.map((item) => this.parseAuctionEntity(item)) || [];
    return auctions;
  }

  async getAuctionById(id: string): Promise<IAuctionEntity | null> {
    const PK = this.generateAuctionPK(id);
    console.log("PK: ", PK);

    const result = await this.dynamodbClient
      .query({
        TableName: this.tableName,
        KeyConditionExpression: "PK = :PK",
        ExpressionAttributeValues: {
          ":PK": PK,
        },
        Limit: 1,
      })
      .promise();

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return this.parseAuctionEntity(result.Items[0]);
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
      Key: {
        PK: this.generateAuctionPK(id),
        SK: auction.endingAt,
      },
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
      PK: toString(get(json, "PK")),
      SK: toString(get(json, "SK")),
      GSI1PK: toString(get(json, "GSI1PK")),
      GSI1SK: toString(get(json, "GSI1SK")),
      id: toString(get(json, "id")),
      title: toString(get(json, "title")),
      status: this.parseAuctionStatus(toString(get(json, "status"))),
      createdAt: toString(get(json, "createdAt")),
      endingAt: toString(get(json, "endingAt")),
      highestBid: this.parseBid(get(json, "highestBid")),
      seller: toString(get(json, "seller")),
      version: toString(get(json, "version")),
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

  private generateAuctionPK(id: string): string {
    if (id.startsWith("AUCTION::")) {
      return id;
    }

    return `AUCTION::${id}`;
  }
}
