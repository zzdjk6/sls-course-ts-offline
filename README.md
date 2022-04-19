# Readme

This is the work-in-progress learning project while taking this udemy course: https://www.udemy.com/course/serverless-framework/

The original repo is https://github.com/arielweinberger/course-auction-service

The goal of this repo is:

- upgrade to the latest framework version
- use TypeScript
- work in both offline and cloud
- demonstrate an organised project structure
- experiment with Cognito authentication
- experiment with input validation tools
- experiment with SQS
- experiment with single-table design

## TODO

- [ ] Experiment on DynamoDB Stream (vs. SQS)
https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.Lambda.Tutorial.html
- [ ] Experiment on Authorizer Lambda for API Gateway + Cognito (vs. inline code call in each lambda) https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
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

There are several options:

1. create a separate lambda as authorizer
2. create middleware
3. create service code

There are pros & cons so we need more experiments and insights:

* Option#1 requires the authorizer lambda to return a very complex result (e.g., aws policy), also it is another lambda call;
* Option#2 requires modify the `event` object to carry more non-standard attributes to read authentication info;
* Option#3 requires to make the function call in each lambda to verify the auth token

Note: to work with this cognito setup, we need to manually set up some users using AWS Console and CLI.

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
