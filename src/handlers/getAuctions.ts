import "source-map-support/register";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { AuctionService } from "../services/AuctionService";
import validator from "@middy/validator";

const getAuctions: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event, context) => {
  // Note: event.queryStringParameters passed validator middleware
  const { status } = event.queryStringParameters as {
    status: "OPEN" | "CLOSED";
  };

  let auctions = await new AuctionService().getAllAuctions({ status });

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

const inputSchema = {
  type: "object",
  properties: {
    queryStringParameters: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["OPEN", "CLOSED"],
          default: "OPEN",
        },
      },
    },
  },
  required: ["queryStringParameters"],
};

export const handler = withDefaultMiddlewares(getAuctions).use(
  validator({
    inputSchema,
    ajvOptions: {
      useDefaults: true,
      strict: false,
    },
  })
);
