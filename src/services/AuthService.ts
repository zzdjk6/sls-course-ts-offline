import toString from "lodash/toString";
import get from "lodash/get";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { ICognitoUser } from "../models/ICognitoUser";

export class AuthService {
  /**
   * Get caller identity
   * @param headers
   */
  public async getCallerIdentity(headers: any): Promise<ICognitoUser | null> {
    if (process.env.IS_OFFLINE) {
      return this.getCallerIdentityOffline(headers);
    }

    // Read the Authorization HTTP header
    const authorizationHeader = toString(get(headers, "Authorization"));
    const tokenComponents = authorizationHeader.split(" ");
    if (tokenComponents.length < 2) {
      return null;
    }
    const accessToken = tokenComponents[1];

    // Get the user using access token
    const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
    let user: ICognitoUser | null = null;
    try {
      const userResponse = await cognitoIdentityServiceProvider.getUser({ AccessToken: accessToken }).promise();
      user = {
        username: userResponse.Username,
        email: userResponse.UserAttributes.find((attr) => attr.Name === "email")?.Value || "",
      };
    } catch {
      // Fail silently
    }

    return user;
  }

  /**
   * Get caller identity when running on offline mode
   * @param headers
   * @private
   */
  private getCallerIdentityOffline(headers: any) {
    const authorizationHeader = toString(get(headers, "Authorization"));
    if (!authorizationHeader) {
      return null;
    }

    const user: ICognitoUser = {
      username: "e93626e2-42d1-4bf9-8c55-2ad4b5b89af8",
      email: "test.user@example.com",
    };
    return user;
  }
}
