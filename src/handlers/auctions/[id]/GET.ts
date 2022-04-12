import "source-map-support/register";
import { withDefaultMiddlewares } from "../../../middlewares/withDefaultMiddlewares";
import { Handler } from "aws-lambda";
import { getAuctionById } from "../../../services/getAuctionById";

const baseHandler: Handler = async (event, context) => {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(baseHandler);
