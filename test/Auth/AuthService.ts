import { CognitoUser } from "@aws-amplify/auth";
import { Amplify, Auth } from "aws-amplify";
import { config } from "./config";

// in cognito its called app client id, in amplify its called user web client id, idk the reason for difference
Amplify.configure({
    Auth: {
        mandatorySignIn: false,
        region: config.REGION,
        userPoolId: config.USER_POOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        authenticationFlowType: 'USER_PASSWORD_AUTH',
    }
})

export class AuthService {
    public async login(userName: string, password: string) {
        const user = await Auth.signIn(userName, password) as CognitoUser;
        return user;

    }
}