import "source-map-support/register";
import { APIGatewayProxyHandler } from "aws-lambda";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { AuctionService } from "../services/AuctionService";
import { AuthService } from "../services/AuthService";
import createHttpError from "http-errors";
import Ajv, { JSONSchemaType } from "ajv";
import { NotificationService } from "../services/NotificationService";

// Note:
//  1. This is to demo using ajv to validate directly
//  2. JSON Schema is too verbose
const inputSchema: JSONSchemaType<{
  title: string;
}> = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
  },
  required: ["title"],
  additionalProperties: false,
};

const validateInputSchema = new Ajv().compile(inputSchema);

const createAuction: APIGatewayProxyHandler = async (event, context) => {
  // Check authentication
  const user = await new AuthService().getCallerIdentity(event.headers);
  if (!user) {
    throw new createHttpError.Unauthorized();
  }

  // Check request payload
  if (!validateInputSchema(event.body)) {
    throw new createHttpError.BadRequest();
  }

  const { title } = event.body;
  const auction = await new AuctionService().createAuction({
    title,
    seller: user.email,
  });

  // Notify the seller
  await new NotificationService().putMessageInQueue({
    subject: `[Seller] Auction has been created: ${auction.id}`,
    recipient: auction.seller,
    body: [`Auction ID: ${auction.id}`, `Auction Title: ${auction.title}`].join("\n"),
  });

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(createAuction);
