import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { getEventBody } from "../Shared/Utils";

// instead of using ! you can just cast as string
const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;


const dbClient = new DynamoDB.DocumentClient();

// Updates an item (using user speified primary key) with a user specified key and value from the request body
async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log('Trying to update an item');
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hellow from DynamoDB'
    }

    try {

        const requestBody = getEventBody(event);
        // note: the ?. is optional chaining
        const spaceId = event.queryStringParameters?.[PRIMARY_KEY]

        if (requestBody && spaceId) {
            const requestBodyKey = Object.keys(requestBody)[0];  // get first key
            const requestBodyValue = requestBody[requestBodyKey];

            const updateResult = await dbClient.update({
                TableName: TABLE_NAME,
                Key: {
                    [PRIMARY_KEY]: spaceId, // he odesnt know why it doesnt work if you dont put in square brackets
                },
                UpdateExpression: 'set #zzzNew = :new',
                ExpressionAttributeNames: {
                    '#zzzNew': requestBodyKey
                },
                ExpressionAttributeValues: {
                    ':new': requestBodyValue
                },
                ReturnValues: 'UPDATED_NEW' // used to get return only updated values, hover to see other options

            }).promise();

            result.body = JSON.stringify(updateResult);
        }
    } catch (error: any) {
        result.body = error.message;
    }


    return result
}

export { handler }
