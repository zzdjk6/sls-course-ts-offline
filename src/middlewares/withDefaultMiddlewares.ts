import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import { Handler } from "aws-lambda";

export const withDefaultMiddlewares = (handler: Handler): middy.MiddyfiedHandler => {
  return middy(handler).use([
    httpJsonBodyParser(),
    httpEventNormalizer(),
    httpErrorHandler({
      fallbackMessage: "Server Error",
    }),
  ]);
};
