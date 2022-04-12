import "source-map-support/register";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { AuctionService } from "../services/AuctionService";

const createAuction: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event, context) => {
  // TODO: schema validation
  const { title } = event.body as any;

  const auction = await new AuctionService().createAuction({ title });

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(createAuction);
