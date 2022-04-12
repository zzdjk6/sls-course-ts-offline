# Readme

This is the work-in-progress learning project while taking this udemy course: https://www.udemy.com/course/serverless-framework/

The original repo is https://github.com/arielweinberger/course-auction-service

The goal of this repo is:

- upgrade to the latest framework version
- use TypeScript
- work locally
- demonstrate an organised project structure

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
