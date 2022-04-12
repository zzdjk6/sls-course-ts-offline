import "source-map-support/register";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Handler,
} from "aws-lambda";
import { AuctionService } from "../services/AuctionService";

const placeBid: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
  event,
  context
) => {
  // TODO: schema validation
  const { id } = event.pathParameters as any;
  const { amount } = event.body as any;

  const updatedAuction = await new AuctionService().placeBidOnAuction({
    id,
    amount,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = withDefaultMiddlewares(placeBid);
