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
- experiment with SQS vs. DynamoDB Stream

# Learning resources

- [Amazon DynamoDB session videos from AWS re:Invent 2021](https://aws.amazon.com/blogs/database/amazon-dynamodb-session-videos-from-aws-reinvent-2021/)

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

## Notes

### Authentication

There are several options:

1. create a separate lambda as authorizer
2. create middleware
3. create service code

Option#1 requires the authorizer lambda to return a very complex result (e.g., aws policy), also it is another lambda call;
Option#2 requires modify the `event` object to carry more non-standard attributes to read authentication info;
Option#3 is preferred as it is simple to call and get the result without extra overhead.

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

## TODO

- [ ] Experiment demo for DynamoDB Stream
- [ ] Run Lambda for scheduled tasks
- [ ] Dead letter queue for fail message deliver
- [ ] Update the schema to fit single-table design (e.g., PK,SK, GSIPK, GSISK)
- [ ] List the access pattern
