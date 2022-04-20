import "source-map-support/register";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { APIGatewayProxyHandler } from "aws-lambda";
import { AuctionService } from "../services/AuctionService";
import * as yup from "yup";
import createHttpError from "http-errors";
import { NotificationService } from "../services/NotificationService";
import get from "lodash/get";
import { IAuctionEntity } from "../models/IAuctionEntity";

// Note: this is to demo validating using yup
const pathParametersSchema = yup.object({
  id: yup.string().required(),
});

const bodySchema = yup.object({
  amount: yup.number().required(),
});

const placeBid: APIGatewayProxyHandler = async (event, context) => {
  // Get user email from authorizer
  const email = get(event.requestContext.authorizer, "claims.email");
  if (!email) {
    throw new createHttpError.Unauthorized();
  }

  // Check input
  let pathParameters: yup.InferType<typeof pathParametersSchema>;
  let body: yup.InferType<typeof bodySchema>;
  try {
    pathParameters = await pathParametersSchema.validate(event.pathParameters);
    body = await bodySchema.validate(event.body);
  } catch {
    throw new createHttpError.BadRequest();
  }

  // Update the record
  let updatedAuction: IAuctionEntity | undefined;

  try {
    updatedAuction = await new AuctionService().placeBidOnAuction({
      id: pathParameters.id,
      amount: body.amount,
      bidder: email,
    });
  } catch (e) {
    throw new createHttpError.BadRequest(e?.message);
  }

  if (!updatedAuction) {
    throw new createHttpError.BadRequest(`Can't update auction ${pathParameters.id}`);
  }

  // Notify the seller and bidder
  const notificationService = new NotificationService();
  await notificationService.putMessageInQueue({
    subject: `[Seller] There is a new bid for your auction ${updatedAuction.id}`,
    recipient: updatedAuction.seller,
    body: [
      `Auction ID: ${updatedAuction.id}`,
      `Auction Title: ${updatedAuction.title}`,
      `Highest Bid Amount: ${updatedAuction.highestBid.amount}`,
      `Highest Bidder: ${updatedAuction.highestBid.bidder}`,
    ].join("\n"),
  });
  await notificationService.putMessageInQueue({
    subject: `[Bidder] You have successfully placed a bid for ${updatedAuction.id}`,
    recipient: email,
    body: [
      `Auction ID: ${updatedAuction.id}`,
      `Auction Title: ${updatedAuction.title}`,
      `Bid Amount: ${updatedAuction.highestBid.amount}`,
      `Seller: ${updatedAuction.seller}`,
    ].join("\n"),
  });

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

export const handler = withDefaultMiddlewares(placeBid);
