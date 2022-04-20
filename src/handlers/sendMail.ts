import AWS from "aws-sdk";
import { Handler, SQSEvent } from "aws-lambda";
import { SendEmailRequest } from "aws-sdk/clients/ses";
import * as yup from "yup";

const recordBodySchema = yup.object({
  subject: yup.string().required(),
  body: yup.string().required(),
  recipient: yup.string().required().email(),
});

type IRecordBody = yup.InferType<typeof recordBodySchema>;

const parseRecordBody = (body: string): Promise<IRecordBody> => {
  return recordBodySchema.validate(JSON.parse(body));
};

const sendMail: Handler<SQSEvent> = async (event, context) => {
  const record = event.Records[0];
  console.log("MailQueue::Processing record: ", record);

  let email: IRecordBody;
  try {
    email = await parseRecordBody(record.body);
  } catch (e) {
    // TODO: put into dead letter queue
    console.error(e);
    return;
  }

  const { subject, body, recipient } = email;

  const params: SendEmailRequest = {
    // TODO: move this to config / env
    Source: "thor.chen.serverless.experiment@gmail.com",
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: subject,
      },
    },
  };

  console.log("Sending email with payload:\n", JSON.stringify(params, null, 2));

  /* Uncomment following code to send email
  try {
    const result = await new AWS.SES().sendEmail(params).promise();
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
  }
  */
};

export const handler = sendMail;
