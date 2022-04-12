import "source-map-support/register";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuctionService } from "../services/AuctionService";

const getAuctionById: Handler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
> = async (event, context) => {
  // TODO: schema validation
  const { id } = event.pathParameters as any;
  const auction = await new AuctionService().getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(getAuctionById);
