import { Stack } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { join } from 'path'


// notice the ? means optional, so we don't have to have a create lambda for all any tables for example.
export interface TableProps {
    tableName: string,
    primaryKey: string,
    secondaryIndexes?: string[],
    createLambdaPath?: string,
    readLambdaPath?: string,
    updateLambdaPath?: string,
    deleteLambdaPath?: string,
    
}

export class GenericTable {
    private stack: Stack;
    private table: Table;
    private props: TableProps;  // type is the interface defined above

    // we will have the following lambdas for a table
    // they can be undefined as they are optional (as defined by TableProps interface above)
    private createLambda: NodejsFunction | undefined;
    private readLambda: NodejsFunction | undefined;
    private updateLambda: NodejsFunction | undefined;
    private deleteLambda: NodejsFunction | undefined;

    // expose the lambda integrations 
    public createLambdaIntegration: LambdaIntegration;
    public readLambdaIntegration: LambdaIntegration;
    public updateLambdaIntegration: LambdaIntegration;
    public deleteLambdaIntegration: LambdaIntegration;


    public constructor(stack: Stack, props: TableProps) {
        this.stack = stack;
        this.props = props;
        this.initialize();
    }

    private initialize(){
        this.createTable();
        this.addSecondaryIndexes();
        this.createLambdas();
        this.grantTableRights();
    }

    // create an actual table, need a name, eg. Employee and the primary key name should be specified
    private createTable(){
        this.table = new Table(this.stack, this.props.tableName, {
            partitionKey: {
                name: this.props.primaryKey,
                type: AttributeType.STRING
            },
            tableName: this.props.tableName
        })
    }

    // add secondary user specified secondary indexes to the created table
    private addSecondaryIndexes() {
        if(this.props.secondaryIndexes) {
            for (const secondaryIndex of this.props.secondaryIndexes) {
                this.table.addGlobalSecondaryIndex({
                    indexName: secondaryIndex,
                    partitionKey: {
                        name: secondaryIndex,
                        type: AttributeType.STRING
                    }            
                })
            }
        }
    }

    // create the CRUD lambdas (if lambda path's specified)
    private createLambdas() {
        // if we a createLambdaPath was set/passed in, then we do wanna havea create lambda,
        // thus we set our createLambda attribute to the result of our lambda creation function
        // notice we pass in the createLambdaPath, which will be used as the lambda name inside the createSingleLambda function
        // we also then initisalse our lambda integration
        if (this.props.createLambdaPath) {
            this.createLambda = this.createSinglelambda(this.props.createLambdaPath);
            this.createLambdaIntegration = new LambdaIntegration(this.createLambda);
        }
        // likewise for the other 3
        if (this.props.readLambdaPath) {
            this.readLambda = this.createSinglelambda(this.props.readLambdaPath);
            this.readLambdaIntegration = new LambdaIntegration(this.readLambda);
        }
        if (this.props.updateLambdaPath) {
            this.updateLambda = this.createSinglelambda(this.props.updateLambdaPath);
            this.updateLambdaIntegration = new LambdaIntegration(this.updateLambda);
        }
        if (this.props.deleteLambdaPath) {
            this.deleteLambda = this.createSinglelambda(this.props.deleteLambdaPath);
            this.deleteLambdaIntegration = new LambdaIntegration(this.deleteLambda);
        }
    }



    // grant rights to the lambdas to interact with the table
    private grantTableRights() {
        // if we have a create lambda function then grantwrite permission to it
        // note, grandWrite/ReadData function is of a dynambo db table, there are other functions you can see too like grant full access.
        if(this.createLambda){
            this.table.grantWriteData(this.createLambda);
        }
        if(this.readLambda){
            this.table.grantReadData(this.readLambda);
        }
        if(this.updateLambda){
            this.table.grantWriteData(this.updateLambda)
        }
        if(this.deleteLambda){
            this.table.grantWriteData(this.deleteLambda);
        }
    }

    private createSinglelambda(lambdaName: string): NodejsFunction {
        // prepend the table name to the lambda id so that we can easily tell what table the lamba belongs to
        const lambdaId = `${this.props.tableName}-${lambdaName}`
        
        // for example, for the entry, the tableName could be SpacesTable and insdie that it could have a Create.ts file for the lambda function (the lambda name will be Create)
        // handler will always be 'handler' as that is the function that will be inside the Create.ts file for example.
        return new NodejsFunction(this.stack, lambdaId, {
            entry: (join(__dirname, '..', 'services', this.props.tableName, `${lambdaName}.ts`)),
            handler: 'handler',
            functionName: lambdaId,
            environment: {
                TABLE_NAME: this.props.tableName,
                PRIMARY_KEY: this.props.primaryKey
            }
        })
    }


 }