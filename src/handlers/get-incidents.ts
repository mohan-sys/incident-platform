import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.INCIDENTS_TABLE_NAME!;

export const handler = async () => {
    const res = await ddb.send(
        new ScanCommand({
            TableName: tableName,
            Limit: 50,
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify({ items: res.Items ?? [] }),
    };
};