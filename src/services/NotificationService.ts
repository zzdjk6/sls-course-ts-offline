import { SQS } from "aws-sdk";

export class NotificationService {
  private sqs: SQS;
  private mailQueueUrl: string;

  constructor() {
    this.sqs = new SQS();
    this.mailQueueUrl = process.env.MAIL_QUEUE_URL || "MailQueue-offline";
  }

  public putMessageInQueue(payload: { subject: string; recipient: string; body: string }) {
    return this.sqs
      .sendMessage({
        QueueUrl: this.mailQueueUrl,
        MessageBody: JSON.stringify({
          subject: payload.subject,
          recipient: payload.recipient,
          body: payload.body,
        }),
      })
      .promise();
  }
}
