/*
 * Copyright (c) 2025, Salesforce, Inc.
 * SPDX-License-Identifier: Apache-2
 * For full license text, see the license.txt file in the repo root or http://www.apache.org/licenses/LICENSE-2.0
 */
import {LambdaClient, InvokeCommand, type InvokeCommandInput} from '@aws-sdk/client-lambda';
import {S3Client, GetObjectCommand, type GetObjectCommandInput} from '@aws-sdk/client-s3';
import {CloudWatchLogsClient, CreateLogStreamCommand, type CreateLogStreamCommandInput} from '@aws-sdk/client-cloudwatch-logs';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand} from '@aws-sdk/lib-dynamodb';
import type {Request, Response} from 'express';

interface IsolationTestParams {
  FunctionName?: string;
  Bucket?: string;
  Key?: string;
  Region?: string;
  logGroupName?: string;
  dalKey?: string;
  dalProjectEnvironment?: string;
}

interface TestResult {
  [key: string]: boolean;
}

const hasErrorName = (error: unknown, name: string): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const awsError = error as {name?: string; message?: string};
  return awsError.name === name || awsError.message === name;
};

export const isolationOriginLambdaTest = async (input: InvokeCommandInput): Promise<boolean> => {
  const client = new LambdaClient();
  try {
    await client.send(new InvokeCommand(input));
  } catch (e) {
    if (hasErrorName(e, 'AccessDeniedException')) return true;
    console.error(e);
  }
  console.error('Lambda isolation test failed!');
  return false;
};

export const isolationS3Test = async (input: GetObjectCommandInput & {Region?: string}): Promise<boolean> => {
  const region = input.Region || process.env.AWS_REGION || 'us-east-1';
  const client = new S3Client({region});
  delete input.Region;
  try {
    await client.send(new GetObjectCommand(input));
  } catch (e) {
    if (hasErrorName(e, 'AccessDenied')) return true;
    console.error(e);
  }
  console.error('S3 isolation test failed!');
  return false;
};

export const isolationLogsTest = async (input: CreateLogStreamCommandInput): Promise<boolean> => {
  const client = new CloudWatchLogsClient();
  try {
    const randomString = Math.random().toString(36).slice(2, 7);
    await client.send(new CreateLogStreamCommand({...input, logStreamName: `new_log_stream_${randomString}`}));
  } catch (e) {
    if (hasErrorName(e, 'AccessDeniedException')) return true;
    console.error(e);
  }
  console.error('Log group isolation test failed!');
  return false;
};

export const isolationDalTest = async (input: {dalKey?: string; dalProjectEnvironment?: string}): Promise<boolean> => {
  if (!process.env.AWS_REGION || !input.dalKey || !input.dalProjectEnvironment) {
    console.error('DAL isolation test failed: missing required parameters');
    return false;
  }
  const tableName = `DataAccessLayer-${process.env.AWS_REGION}`;
  const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({region: process.env.AWS_REGION}));
  try {
    await ddbClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {projectEnvironment: input.dalProjectEnvironment, key: input.dalKey},
      }),
    );
  } catch (e) {
    if (hasErrorName(e, 'AccessDeniedException')) return true;
    console.error(e);
  }
  console.error("DAL isolation test failed: Target B accessed Target A's DAL entry");
  return false;
};

export const executeIsolationTests = async (params: IsolationTestParams): Promise<TestResult> => {
  const tests = [
    {name: 'origin', keys: ['FunctionName'], fn: isolationOriginLambdaTest},
    {name: 'storage', keys: ['Bucket', 'Key', 'Region'], fn: isolationS3Test},
    {name: 'logs', keys: ['logGroupName'], fn: isolationLogsTest},
    {name: 'dal', keys: ['dalKey', 'dalProjectEnvironment'], fn: isolationDalTest},
  ];
  const results: TestResult = {};
  for (const test of tests) {
    const {keys, fn, name} = test;
    const input = Object.keys(params)
      .filter((key) => keys.includes(key))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((obj: Record<string, any>, key) => {
        obj[key] = params[key as keyof IsolationTestParams];
        return obj;
      }, {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results[name] = await fn(input as any);
  }
  return results;
};

export const isolationTests = async (req: Request, res: Response): Promise<void> => {
  const results = await executeIsolationTests(req.query);
  res.header('Content-Type', 'application/json');
  res.send(JSON.stringify(results, null, 4));
};
