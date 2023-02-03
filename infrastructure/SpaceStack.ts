import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function as LambdaFunction, Runtime} from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { GenericTable } from './GenericTable';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';


export class SpaceStack extends Stack {

    private api = new RestApi(this, 'SpaceApi');
    
    // create an actual table called SpacesTable
    // Note that we have creaed a folder with same name as tableName, SpacesTable, which has files for each lambda we defined inside...
    // ... the GenericTable class will automatically hook these up to the created table for us.
    // the constructor of the GenericTableClass will create the table,
    // create some lambdas for CRUD operations and grant these lambdas appropriate rights so they work.
    private spacesTable = new GenericTable(this, {
        tableName: 'SpacesTable',
        primaryKey: 'spaceId',
        createLambdaPath: 'Create', // name of the create lambda file in the SpacesFolder directory
        readLambdaPath: 'Read',
        updateLambdaPath: 'Update',
        deleteLambdaPath: 'Delete',
        secondaryIndexes: ['location']
    })

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const helloLambdaNodeJs = new NodejsFunction(this, 'helloLambdaNodeJs', {
            entry: join(__dirname, '..', 'services', 'node-lambda', 'hello.ts'),
            handler: 'handler'
        })
        const s3ListPolicy = new PolicyStatement();
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
        s3ListPolicy.addResources('*');
        helloLambdaNodeJs.addToRolePolicy(s3ListPolicy);

        // hello api lambda integration:
        // (links together api gateway and lmbda function)
        const helloLambdaIntegration = new LambdaIntegration(helloLambdaNodeJs)
        const helloLambdaResource = this.api.root.addResource('hello')
        helloLambdaResource.addMethod('GET', helloLambdaIntegration);


        // Spaces API integrations
        // add a new resource called spaces
        // thus we will have an endpoint http..../spaces
        const spaceResource = this.api.root.addResource('spaces');
        // add a POST method that refers to the createLambdaIntegration attribute of the spacesTable
        spaceResource.addMethod('POST', this.spacesTable.createLambdaIntegration);
        spaceResource.addMethod('GET', this.spacesTable.readLambdaIntegration);
        spaceResource.addMethod('PUT', this.spacesTable.updateLambdaIntegration);
        spaceResource.addMethod('DELETE', this.spacesTable.deleteLambdaIntegration);

    }
}