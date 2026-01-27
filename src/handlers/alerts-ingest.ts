import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { corsHeaders } from "../lib/cors";

/**
 * SQS client (uses IAM role provided by Lambda)
 */
const sqs = new SQSClient({});

/**
 * Queue URL injected via SAM template (Environment Variables)
 */
const queueUrl = process.env.ALERTS_QUEUE_URL!;

/**
 * Shape of incoming alert payload
 */
type AlertPayload = {
  service: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  source?: string;
};

/**
 * POST /alerts
 * Receives alerts and pushes them to SQS for async processing
 */
export const handler = async (event: any) => {
  // CORS preflight
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const body = event?.body ? JSON.parse(event.body) : null;

    // Basic validation (important in real APIs)
    if (!body?.service || !body?.severity || !body?.message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required fields: service, severity, message",
        }),
      };
    }

    const alert: AlertPayload = {
      service: body.service,
      severity: body.severity,
      message: body.message,
      source: body.source ?? "unknown",
    };

    // Send alert to SQS (decouples ingestion from processing)
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          alert,
          receivedAt: new Date().toISOString(),
        }),
      })
    );

    return {
      statusCode: 202,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "queued",
        message: "Alert accepted for processing",
      }),
    };
  } catch (error) {
    console.error("Failed to ingest alert", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};