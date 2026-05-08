# Serverless Incident Management Platform

A production-grade AWS serverless incident management system that reduced mean incident acknowledgement time by **70%** through automated multi-level escalation workflows, real-time alerting, and on-call scheduling.

🔗 **Live Demo:** [incident-platform-omega.vercel.app](https://incident-platform-omega.vercel.app)

---

## Architecture

```
Incoming Alert
      │
      ▼
API Gateway  ──►  Lambda (Ingest)  ──►  DynamoDB (Store)
                        │
                        ▼
                   SQS Queue
                        │
                        ▼
              Lambda (Escalation Engine)
                  │            │
                  ▼            ▼
            SNS Email      SNS SMS
          Notification   Notification
                  │
                  ▼
          CloudWatch Alarms + Logs
```

Alert ingestion flows through API Gateway into a Lambda function that stores incident data in DynamoDB and queues it via SQS. The escalation engine Lambda processes the queue, applies on-call scheduling logic, and triggers SNS notifications via email and SMS. CloudWatch provides end-to-end observability across all Lambda functions.

---

## Key Features

- **Multi-level escalation engine** — automatically routes unacknowledged alerts through on-call tiers via SQS to Lambda to SNS with configurable escalation windows
- **Real-time React dashboard** — displays live incident feed with MTTR and MTTA analytics
- **Amazon Cognito authentication** — JWT-secured login with role-based access control
- **Global delivery** — frontend served via S3 and CloudFront for low-latency access
- **Zero-downtime CI/CD** — automated deployment pipeline via GitHub Actions
- **Security first** — IAM least-privilege roles applied across all AWS resources
- **Full observability** — CloudWatch alarms and structured logging across all Lambda functions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Compute | AWS Lambda (Node.js / TypeScript) |
| API | Amazon API Gateway |
| Messaging | Amazon SQS, Amazon SNS |
| Database | Amazon DynamoDB |
| Auth | Amazon Cognito |
| CDN | Amazon CloudFront + S3 |
| IaC | AWS SAM (template.yaml) |
| Frontend | React.js, TypeScript |
| CI/CD | GitHub Actions |
| Observability | Amazon CloudWatch |

---

## Results

| Metric | Result |
|---|---|
| Mean incident acknowledgement time | 70% reduction |
| Escalation tiers supported | Multi-level with configurable windows |
| Notification channels | Email and SMS via SNS |
| Deployment | Zero-downtime via GitHub Actions |

---

## Project Structure

```
incident-platform/
├── src/                        # Lambda function handlers
├── frontend/                   # React dashboard (TypeScript)
├── __tests__/unit/handlers/    # Unit tests (Jest)
├── events/                     # SAM local test events
├── template.yaml               # AWS SAM infrastructure definition
├── buildspec.yml               # CodeBuild build specification
└── samconfig.toml              # SAM deployment configuration
```

---

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate permissions
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Node.js 20](https://nodejs.org/en/)
- [Docker](https://hub.docker.com/search/?type=edition&offering=community) (for local testing)

---

## Setup & Deployment

### 1. Clone the repository

```bash
git clone https://github.com/mohan-sys/incident-platform.git
cd incident-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run unit tests

```bash
npm run test
```

### 4. Build and deploy to AWS

```bash
sam build
sam deploy --guided
```

Follow the prompts to configure your stack name, AWS region, and IAM permissions.

### 5. Local development

```bash
sam local start-api
curl http://localhost:3000/
```

---

## CI/CD Pipeline

The project uses GitHub Actions for automated deployments. On every push to `main`:

1. Unit tests are run via Jest
2. SAM build compiles and packages Lambda functions
3. SAM deploy pushes changes to AWS CloudFormation
4. CloudFront cache is invalidated for frontend updates

---

## Cleanup

To remove all deployed AWS resources:

```bash
sam delete --stack-name incident-platform
```

---

## Author

**Mohan Raj Loganathan**
Graduate Cloud & Backend Engineer

🔗 [LinkedIn](https://linkedin.com/in/mohanrajloganathan) · [Portfolio](https://mohansportfolio.vercel.app) · [GitHub](https://github.com/mohan-sys)
