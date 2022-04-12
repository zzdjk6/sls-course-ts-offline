import "source-map-support/register";
import { Handler } from "aws-lambda";
import { withDefaultMiddlewares } from "../../middlewares/withDefaultMiddlewares";
import { createAuction } from "../../services/createAuction";

const baseHandler: Handler = async (event, context) => {
  const { title } = event.body;
  const auction = await createAuction({ title });

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(baseHandler);
