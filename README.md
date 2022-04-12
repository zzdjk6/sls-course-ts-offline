# Readme

This is the work-in-progress learning project while taking this udemy course: https://www.udemy.com/course/serverless-framework/

The original repo is https://github.com/arielweinberger/course-auction-service

The goal of this repo is:

- upgrade to the latest framework version
- use TypeScript
- work locally
- demonstrate an organised project structure

# How to?

## Run locally

```bash
# only need to run once
sls dynamodb install

# needs to run every time
sls offline cloudside
```

## View data locally

install and use `dynamodb-admin`.

## Troubleshooting

if `java.net.BindException: Address already in use`

```bash
# find out who is taking that port
lsof -i tcp:8000

# kill it
kill -9 xxxx
```
