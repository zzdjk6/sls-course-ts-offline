import "source-map-support/register";
import { Handler } from "aws-lambda";
import { withDefaultMiddlewares } from "../../middlewares/withDefaultMiddlewares";
import { getAllAuctions } from "../../services/getAllAuctions";

const baseHandler: Handler = async (event, context) => {
  let auctions = await getAllAuctions();

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

export const handler = withDefaultMiddlewares(baseHandler);
