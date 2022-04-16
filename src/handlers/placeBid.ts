import "source-map-support/register";
import { withDefaultMiddlewares } from "../middlewares/withDefaultMiddlewares";
import { APIGatewayProxyHandler } from "aws-lambda";
import { AuctionService } from "../services/AuctionService";
import * as yup from "yup";
import { AuthService } from "../services/AuthService";
import createHttpError from "http-errors";
import { NotificationService } from "../services/NotificationService";

// Note: this is to demo validating using yup
const pathParametersSchema = yup.object({
  id: yup.string().required(),
});

const bodySchema = yup.object({
  amount: yup.number().required(),
});

const placeBid: APIGatewayProxyHandler = async (event, context) => {
  // Check authentication
  const user = await new AuthService().getCallerIdentity(event.headers);
  if (!user) {
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
  const updatedAuction = await new AuctionService().placeBidOnAuction({
    id: pathParameters.id,
    amount: body.amount,
    bidder: user.email,
  });

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
    recipient: user.email,
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
