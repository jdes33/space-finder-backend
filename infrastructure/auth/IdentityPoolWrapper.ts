import { CfnOutput } from "aws-cdk-lib";
import { UserPool, UserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } from "aws-cdk-lib/aws-cognito";
import { Effect, FederatedPrincipal, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class IdentityPoolWrapper {

    private scope: Construct;
    private userPool: UserPool;
    private userPoolClient: UserPoolClient;

    private identityPool: CfnIdentityPool;
    private authenticatedRole: Role;
    private unauthenticatedRole: Role;
    // make public so can be accessed outside
    public adminRole: Role;

    constructor(scope: Construct, userPool: UserPool, userPoolClient: UserPoolClient) {
        this.scope = scope;
        this.userPool = userPool;
        this.userPoolClient = userPoolClient;
        this.initialise();
    }

    private initialise() {
        this.initialiseIdentityPool();
        this.initialiseRoles();
        this.attachRoles();
    }

    private initialiseIdentityPool() {
        this.identityPool = new CfnIdentityPool(this.scope, 'SpaceFinderIdentityPool', {
            allowUnauthenticatedIdentities: true, // MAYBE CHANGE THIS FOR YOUR ROSTERING ONE
            cognitoIdentityProviders: [{
                clientId: this.userPoolClient.userPoolClientId,
                providerName: this.userPool.userPoolProviderName
            }]

        });
        // output the identity pool id
        new CfnOutput(this.scope, 'IdentityPoolId', {
            value: this.identityPool.ref
        })
    }

    private initialiseRoles(){

        // initialise unauthenticated role
        this.authenticatedRole = new Role(this.scope, 'CognitoDefaultAuthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated'
                }
            },
                'sts:AssumeRoleWithWebIdentity'
            )
        });

        // initialise authenticated role
        this.unauthenticatedRole = new Role(this.scope, 'CognitoDefaultUnAuthenticatedRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'unauthenticated'
                }
            },
                'sts:AssumeRoleWithWebIdentity'
            )
        });

        // initialise a role for admins
        this.adminRole = new Role(this.scope, 'CognitoAdminRole', {
            assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
                StringEquals: {
                    'cognito-identity.amazonaws.com:aud': this.identityPool.ref
                },
                'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated'
                }
            },
                'sts:AssumeRoleWithWebIdentity'
            )
        });

        // add the admin role to a policy that says they can list all buckets
        this.adminRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:ListAllMyBuckets'
            ],
            resources: ['*']
        }))

    }

    private attachRoles() {
        new CfnIdentityPoolRoleAttachment(this.scope, 'RolesAttachment', {
            identityPoolId: this.identityPool.ref,
            roles: {
                'authenticated': this.authenticatedRole.roleArn,
                'unauthenticated': this.unauthenticatedRole.roleArn
            },
            roleMappings: {
                // just made up the adminsMapping name i believe
                adminsMapping : {
                    type: 'Token',
                    ambiguousRoleResolution: 'AuthenticatedRole',
                    identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`
                }
            }
        })
    }
}