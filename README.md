# Readme

This is the work-in-progress learning project while taking this udemy course: https://www.udemy.com/course/serverless-framework/

The original repo is https://github.com/arielweinberger/course-auction-service

The goal of this repo is:

- upgrade to the latest framework version
- use TypeScript
- work in both offline and cloud
- demonstrate an organised project structure
- experiment with Cognito authentication: inline vs. authorizer
- experiment with input validation tools
- experiment with SQS
- experiment with single-table design

## TODO

- [ ] Experiment on DynamoDB Stream (vs. SQS)
  - https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial.html
- [ ] Dead letter queue for fail message deliver
- [ ] Run Lambda for scheduled tasks

# Learning resources

- [Amazon DynamoDB session videos from AWS re:Invent 2021](https://aws.amazon.com/blogs/database/amazon-dynamodb-session-videos-from-aws-reinvent-2021/)
- [Alex DeBrie's blog](https://www.alexdebrie.com/)
- [Working with Queries in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.KeyConditionExpressions)

# How to?

## Prepare

```bash
npm install -g serverless

npm install
```

## Run locally

```bash
# only need to run once
sls dynamodb install

# needs to run every time
sls offline cloudside
```

## View data locally

install and use `dynamodb-admin`:

```bash
npm install -g dynamodb-admin

dynamodb-admin
```

## API Access

Import postman collection: `postman_collection.json` and setup environment vars (e.g., `root_path: http://localhost:4000/dev`)

## Troubleshooting

if `java.net.BindException: Address already in use`

```bash
# find out who is taking that port
lsof -i tcp:8000

# kill it
kill -9 xxxx
```

if `Error: EPERM: operation not permitted, unlink ...`, then `rm -rf ./.build`

## Notes

### Authentication

- [Lambda Authorizer Concept](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [Authorizer CDK Example](https://github.com/aws-samples/aws-cdk-examples/blob/e25494ab4f1766a492153e5a40a9216cd1e096a1/typescript/cognito-api-lambda/index.ts#L31-L39)
- [Manual Authorizer Config](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html)
- [Tutorial on FreeCodeCamp](https://www.freecodecamp.org/news/aws-cognito-authentication-with-serverless-and-nodejs/)

There are several options:

1. create a separate lambda as authorizer
2. create middleware
3. create service code

In this repo, I have included example code for Option#1 and Option#3.

References:
- See `createAuction` for inline Cognito service call
- See `getAuctions` and `placeBid` for Cognito user pool authorizer integration

Note#1: to work with this cognito setup, we need to manually set up some users using AWS Console and CLI.

```bash
# Confirm user password
aws cognito-idp admin-set-user-password \
    --user-pool-id <cognito_user_pool_id> \
    --username <user_name> \
    --password <password> \
    --permanent
  
aws cognito-idp admin-initiate-auth \
    --user-pool-id <cognito_user_pool_id> \
    --client-id <cognito_user_client_id> \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters USERNAME=<user_name>,PASSWORD=<password>
  
```

Note#2: only `IdentityToken` works, `AccessToken` is not working.

Note#3: the current example in this repo is based on API Gateway V1 (REST API).

For V2 (HTTP API), it is different -- Cognito should be configured as JWT issuer:

- https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html
- https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-authorizer.html
- https://www.serverless.com/framework/docs/providers/aws/events/http-api#jwt-authorizers

### Input validation

Options:

1. JSON Schema
2. yup / zod / joi

Option#1:
* pros: not bound to specific language, i.e., can use same JSON schema in another language such as Java or Python
* cons: requires a very tedious coding format to do very simple stuff

Option#2:
* pros: productive, i.e., easy to read & write
* cons: library locked-in

### Notification

We explore 2 options to trigger notification:
1. API Gateway -> Lambda -> SQS -> Lambda -> SES
2. DynamoDB Stream -> Lambda -> SES

### Data access pattern

- Create auction
- Get auctions
  - by status, ordered by end date desc
- Get auction
  - by id
- Update auction
  - by id, update the highest bid info
- Update auctions
  - by ending date and status: close expired auction

### Key divider symbol

In many examples, we see keys or attributes are using `#` or `_` as divider, but there are some issues:

- `#`: if we expect the entire value to be used in url, then `#` needs to be encoded when sending request and decoded when receiving request, because `#` has special meaning in url;
- `_`: there might be conflicts when stored value can also have `_`;

So in this example, I use `::`.

However, as long as we use a separate `id` attribute in request instead of passing `PK`, we can either construct `PK` for query or build a GSI for `id`.

### Query key conditions

We can not use functions with Partition Key (HASH key), if we try to do so, we will receive a `ValidationException: Query key condition not supported`.

> You must specify the partition key name and value as an equality condition
> -- from: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html#Query.KeyConditionExpressions
