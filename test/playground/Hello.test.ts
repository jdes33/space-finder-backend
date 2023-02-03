import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../services/SpacesTable/Create";

const event: APIGatewayProxyEvent = {
    body: {
        name: 'another name',
        location: 'right'
    }
} as any;

// handler returns a Promise<APIGatewayProxyResult>,
// ... so we use the .then method (which gives us access to apiResult,
// which is of type APIGatewayProxyResult aka not a Promise)
//  and pass in a callback function,
// which simply parses the body as a JSON,
// we did this so we can set a breakpoint at the console log line,
// and when we debug we see the items properly laid out
const result = handler(event, {} as any).then((apiResult) => {
    const items = JSON.parse(apiResult.body);
    console.log(123);
});

