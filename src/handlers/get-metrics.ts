import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { corsHeaders } from "../../frontend/src/lib/cors";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.INCIDENTS_TABLE_NAME!;

function parseDays(raw: any, fallback = 7) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 90); // safety cap
}

export const handler = async (event: any) => {
  // CORS preflight
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const qs = event?.queryStringParameters ?? {};

  // If days is NOT provided -> all-time metrics
  // If days is provided -> windowed metrics
  const rawDays = qs.days;
  const days = rawDays === undefined ? null : parseDays(rawDays, 7);
  const cutoffMs = days === null ? null : Date.now() - days * 24 * 60 * 60 * 1000;

  let total = 0;
  let open = 0;
  let resolved = 0;

  let mttaSum = 0;
  let mttaCount = 0;

  let mttrSum = 0;
  let mttrCount = 0;

  const bySeverity: Record<string, number> = {};

  let lastKey: any = undefined;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1_AllByCreatedAt",
        KeyConditionExpression: "gsi1pk = :all",
        ExpressionAttributeValues: { ":all": "ALL" },
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of res.Items ?? []) {
      const createdMs = Date.parse(item.createdAt);
      if (!Number.isFinite(createdMs)) continue;

      // Apply window filter only if days was provided
      if (cutoffMs !== null && createdMs < cutoffMs) continue;

      total++;

      if (item.status === "OPEN") open++;
      if (item.status === "RESOLVED") resolved++;

      // MTTA: only if acknowledgedAt exists and is after createdAt
      if (item.acknowledgedAt) {
        const ackMs = Date.parse(item.acknowledgedAt);
        if (Number.isFinite(ackMs) && ackMs >= createdMs) {
          mttaSum += (ackMs - createdMs) / 1000;
          mttaCount++;
        }
      }

      // MTTR: only if resolvedAt exists and is after createdAt
      if (item.resolvedAt) {
        const resMs = Date.parse(item.resolvedAt);
        if (Number.isFinite(resMs) && resMs >= createdMs) {
          mttrSum += (resMs - createdMs) / 1000;
          mttrCount++;
        }
      }

      const sev = item.severity ?? "UNKNOWN";
      bySeverity[sev] = (bySeverity[sev] ?? 0) + 1;
    }

    lastKey = res.LastEvaluatedKey;
  } while (lastKey);

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      windowDays: days, // null means all-time
      totalIncidents: total,
      openIncidents: open,
      resolvedIncidents: resolved,
      avgMTTASeconds: mttaCount ? Math.round(mttaSum / mttaCount) : null,
      avgMTTRSeconds: mttrCount ? Math.round(mttrSum / mttrCount) : null,
      bySeverity,
    }),
  };
};