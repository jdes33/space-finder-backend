import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 } from "uuid";

// environment variables are just some info we pass to our lambda
// we will use it here so we don't have to hardcode the table name
// (when we create a NodeJsfunction we can pass values as the value for the environment key in the props)
// table name type is string or undefined as 
// at time when its called nodejs cant be sure if this key will be available in this process.
const TABLE_NAME = process.env.TABLE_NAME

const dbClient = new DynamoDB.DocumentClient();

async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const result: APIGatewayProxyResult = {
        statusCode: 200,
        body: 'Hellow from DynamoDB'
    }

    const item = typeof event.body == 'object' ? event.body: JSON.parse(event.body);
    item.spaceId = v4();


    
    try {
        // here we put an item into the SpacesTable
        // the item we put will have an id as created above, and anything else that was passed in as event
        await dbClient.put({
            TableName: TABLE_NAME!, // due to type of TABLE_NAME we use ! to show we are sure it exists (if it doesnt exist we will get an error in result body anyways so adding the ! doesnt break anything)
            Item: item
        }).promise()
    } catch (error: any) {
        result.body = error.message
    }
    result.body = JSON.stringify(`Created item with id: ${item.spaceId}`);

    return result
}

export { handler }
