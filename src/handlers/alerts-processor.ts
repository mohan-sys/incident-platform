import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const sns = new SNSClient({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const tableName = process.env.INCIDENTS_TABLE_NAME!;
const topicArn = process.env.NOTIFICATIONS_TOPIC_ARN!;

export const handler = async (event: any) => {
  for (const record of event.Records ?? []) {
    const msg = JSON.parse(record.body);
    const alert = msg.alert;

    const incidentId = randomUUID();
    const createdAt = new Date().toISOString();

    const item = {
      incidentId,
      service: alert.service,
      severity: alert.severity,
      summary: alert.message,
      source: alert.source ?? "unknown",
      status: "OPEN",
      createdAt,
      acknowledgedAt: null,
      resolvedAt: null,
    };

    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    await sns.send(
      new PublishCommand({
        TopicArn: topicArn,
        Subject: `[${item.severity}] Incident: ${item.service}`,
        Message: `Incident created\n\nService: ${item.service}\nSeverity: ${item.severity}\nSummary: ${item.summary}\nIncidentId: ${incidentId}\nCreatedAt: ${createdAt}`,
      })
    );
  }

  return { statusCode: 200 };
};