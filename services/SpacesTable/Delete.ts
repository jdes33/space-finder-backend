import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

// instead of using ! you can just cast as string
const TABLE_NAME = process.env.TABLE_NAME as string;
const PRIMARY_KEY = process.env.PRIMARY_KEY as string;


const dbClient = new DynamoDB.DocumentClient();

// Deletes an item from table (using user speified primary key)
async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    console.log('Trying to update an item');
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hellow from DynamoDB'
    }

    try {
        const spaceId = event.queryStringParameters?.[PRIMARY_KEY]

        if (spaceId) {
            const deleteResult = await dbClient.delete({
                TableName: TABLE_NAME,
                Key: {
                    [PRIMARY_KEY]: spaceId
                }
            }).promise()
            result.body = JSON.stringify(deleteResult);
        }
    } catch (error: any) {
        result.body = error.message;
    }
    return result
}

export { handler }
