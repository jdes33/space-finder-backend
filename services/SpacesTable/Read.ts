import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult, Context } from "aws-lambda";

const TABLE_NAME = process.env.TABLE_NAME;
const PRIMARY_KEY = process.env.PRIMARY_KEY;

const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hellow from DynamoDB'
    }
    console.log(`Reading items from ${TABLE_NAME}`);

    try {
        if (event.queryStringParameters) {
            if (PRIMARY_KEY! in event.queryStringParameters) {
                console.log(`Querying items from ${TABLE_NAME}, with primary partition=${PRIMARY_KEY!}`)
                result.body = await queryWithPrimaryPartition(event.queryStringParameters);
            } else {
                // if we dont have the primary key in the query string paramters then...
                // ... query with secondary key params
                console.log(`Querying items from ${TABLE_NAME}, using secondary partion`)
                result.body = await queryWithSecondaryPartition(event.queryStringParameters);
            }

        } else {
            console.log(`Scanning (reading all) items from ${TABLE_NAME}`)
            result.body = await scanTable();
        }

    } catch (error: any) {
        result.body = error.message
    }

    return result
}



async function queryWithSecondaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
    console.log("inside secondary partition function");
    const queryKey = Object.keys(queryParams)[0];  // get the first query param
    const queryValue = queryParams[queryKey];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        IndexName: queryKey,
        KeyConditionExpression: '#jj = :jjj',
        ExpressionAttributeNames: {
            '#jj': queryKey
        },
        ExpressionAttributeValues: {
            ':jjj': queryValue
        }
    }).promise();
    return JSON.stringify(queryResponse.Items);
}


async function queryWithPrimaryPartition(queryParams: APIGatewayProxyEventQueryStringParameters) {
    const keyValue = queryParams[PRIMARY_KEY!];
    const queryResponse = await dbClient.query({
        TableName: TABLE_NAME!,
        // have to do roundabout way as dynamodb has a lot  of reserved keywords
        // Thus we use a KeyConditionExpression to get around this
        // note: didnt have to use jj, could use anything
        KeyConditionExpression: '#jj = :jjj',
        ExpressionAttributeNames: {
            '#jj': PRIMARY_KEY!
        },
        ExpressionAttributeValues: {
            ':jjj': keyValue
        }

    }).promise();
    return JSON.stringify(queryResponse.Items);
}

// scans/gets all the items in the table
async function scanTable() {
    // notice we use the scan method to read all items
    const queryResponse = await dbClient.scan({
        TableName: TABLE_NAME!, // due to type of TABLE_NAME we use ! to show we are sure it exists (if it doesnt exist we will get an error in result body anyways so adding the ! doesnt break anything)
    }).promise()

    return JSON.stringify(queryResponse.Items);
}



export { handler }
