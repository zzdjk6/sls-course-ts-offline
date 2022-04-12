import "source-map-support/register";
import { withDefaultMiddlewares } from "../../../../middlewares/withDefaultMiddlewares";
import { Handler } from "aws-lambda";
import { placeBidOnAuction } from "../../../../services/placeBidOnAuction";

const baseHandler: Handler = async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;

  const updatedAuction = await placeBidOnAuction({
    id,
    amount,
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = withDefaultMiddlewares(baseHandler);
