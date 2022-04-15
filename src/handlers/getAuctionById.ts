import "source-map-support/register";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { APIGatewayProxyHandler } from "aws-lambda";
import { AuctionService } from "../services/AuctionService";
import { AuthService } from "../services/AuthService";
import createHttpError from "http-errors";
import * as yup from "yup";

// Note: this is to demo validating using yup
const pathParametersSchema = yup.object({
  id: yup.string().required(),
});

const getAuctionById: APIGatewayProxyHandler = async (event, context) => {
  // Check authentication
  const user = await new AuthService().getCallerIdentity(event.headers);
  if (!user) {
    throw new createHttpError.Unauthorized();
  }

  const { id } = await pathParametersSchema.validate(event.pathParameters);
  const auction = await new AuctionService().getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = withDefaultMiddlewares(getAuctionById);
