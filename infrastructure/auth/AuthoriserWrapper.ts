import { CfnOutput } from "aws-cdk-lib";
import { CognitoUserPoolsAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { CfnUserPoolGroup, UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { IdentityPoolWrapper } from "./IdentityPoolWrapper";


export class AuthoriserWrapper {
    private scope: Construct;
    private api: RestApi;

    private userPool: UserPool;
    private userPoolClient: UserPoolClient;
    public authoriser: CognitoUserPoolsAuthorizer;
    private identityPoolWrapper: IdentityPoolWrapper;

    constructor(scope: Construct, api: RestApi) {
        this.scope = scope;
        this.api = api;
        this.initialise();
    }

    private initialise() {
        this.createUserPool();
        this.addUserPoolClient();
        this.createAuthoriser();
        this.initialiseIdentityPoolWrapper();
        this.createAdminsGroup();
    }

    private createUserPool() {
        this.userPool = new UserPool(this.scope, 'SpaceUserPool', {
            userPoolName: 'SpaceUserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                username: true,
                email: true
            }
        });

        // output the user pool id using cfn
        new CfnOutput(this.scope, 'userPoolId', {
            value: this.userPool.userPoolId
        })
    }

    private addUserPoolClient() {
        this.userPoolClient = this.userPool.addClient('SpaceUserPool-client', {
            userPoolClientName: 'SpaceUserPool-client',
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true  // he don't know what this is
            },
            generateSecret: false
        })
        new CfnOutput(this.scope, 'userPoolClientId', {
            value: this.userPoolClient.userPoolClientId
        })
    }

    // (if you go to API gateway on aws console you will now see the name authoriser below being using if you've applied it to an enpoint)
    private createAuthoriser() {
        this.authoriser = new CognitoUserPoolsAuthorizer(this.scope, 'SpaceUserAuthoriser', {
            cognitoUserPools: [this.userPool],
            authorizerName: 'SpaceUserAuthoriser',
            identitySource: 'method.request.header.Authorization',
        })
        this.authoriser._attachToApi(this.api);
    }

    private initialiseIdentityPoolWrapper(){
        this.identityPoolWrapper = new IdentityPoolWrapper(
            this.scope,
            this.userPool,
            this.userPoolClient
        )
    }

    // create a user pool group called admins
    private createAdminsGroup() {
        new CfnUserPoolGroup(this.scope, 'admins', {
            groupName: 'admins',
            userPoolId: this.userPool.userPoolId,
            roleArn: this.identityPoolWrapper.adminRole.roleArn
        })
    }
}