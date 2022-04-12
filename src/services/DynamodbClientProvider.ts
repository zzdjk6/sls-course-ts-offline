import { DynamoDB } from "aws-sdk";

export class DynamodbClientProvider {
  static getDocumentClient(): DynamoDB.DocumentClient {
    if (process.env.IS_OFFLINE) {
      return new DynamoDB.DocumentClient({
        region: "localhost",
        endpoint: "http://localhost:8000",
        accessKeyId: "DEFAULT_ACCESS_KEY", // needed if you don't have aws credentials at all in env
        secretAccessKey: "DEFAULT_SECRET", // needed if you don't have aws credentials at all in env
      });
    }

    return new DynamoDB.DocumentClient();
  }
}
