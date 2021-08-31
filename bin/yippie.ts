#!/usr/bin/env node

import { join } from 'path';
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import AWS from 'aws-sdk';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import AdmZip from 'adm-zip';
import { version } from '../package.json';

const optionDefinitions = [
  {
    name: 'folder',
    alias: 'f',
    type: String,
    defaultOption: true,
    description: 'Folder to deploy.',
  },
  { name: 'username', alias: 'u', type: String, description: 'Your yippie cloud username.' },
  { name: 'password', alias: 'p', type: String, description: 'Your yippie cloud password.' },
  { name: 'help', alias: 'h', type: Boolean, description: 'Display this usage guide.' },
  { name: 'verbose', alias: 'v', type: Boolean, description: 'Enable verbose outputs.' },
];
const options = commandLineArgs(optionDefinitions);

if (options.help) {
  const usage = commandLineUsage([
    { header: 'Usage', content: 'yippie example' },
    { header: 'Options', optionList: optionDefinitions },
    { content: 'Home: {underline https://www.yippie.cloud}' },
  ]);
  console.log(usage);
}

const { folder, verbose = false } = commandLineArgs(optionDefinitions);
const clientId = process.env.YIPPIE_CLIENTID;
const bucketName = process.env.YIPPIE_BUCKET;
const region = process.env.YIPPIE_REGION;
const identityPoolId = process.env.YIPPIE_IDENTITYPOOLID;
const userPoolId = process.env.YIPPIE_USERPOOLID;
const artifactDeploymentFunction = process.env.YIPPIE_ARTIFACTDEPLOMENT_FUNCTION;

config();

const username = process.env.YIPPIE_USERNAME || options.username;
const password = process.env.YIPPIE_PASSWORD || options.password;

if (!username) {
  console.error('Username is missing');
  process.exit(1);
}

if (!password) {
  console.error('Password is missing');
  process.exit(1);
}

const userPool = new CognitoUserPool({ ClientId: clientId, UserPoolId: userPoolId });
const cognitoUser = new CognitoUser({ Pool: userPool, Username: username });
const authenticationDetails = new AuthenticationDetails({ Username: username, Password: password });

cognitoUser.authenticateUser(authenticationDetails, {
  onFailure: (error) => {
    console.error(error.message);
  },
  onSuccess: (identity) => {
    AWS.config.update({
      maxRetries: 0,
      httpOptions: {
        timeout: 6000000,
        connectTimeout: 6000000,
      },
      region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: identityPoolId,
        Logins: {
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: identity.getIdToken().getJwtToken(),
        },
      }),
    });
    (AWS.config.credentials as any).refresh(async (error: any) => {
      console.log(`Yippie cloud CLI v${version}`);
      if (error) return console.error(error.message);
      console.log('Login successfully!');

      const s3 = new AWS.S3();
      const lambda = new AWS.Lambda();

      try {
        console.log(`Zipping file(s) ...`);
        const timestamp = Date.now();
        const zip = new AdmZip();
        zip.addLocalFolder(join(process.cwd(), folder));

        console.log(`Uploading file ...`);
        await s3
          .upload({ Bucket: bucketName, Key: `${username}/${folder}-${timestamp}.zip`, Body: zip.toBuffer() })
          .promise();

        console.log(`Deploying... (up to 5 minutes)`);
        const fileContent = readFileSync(join(process.cwd(), folder, `.yippie.json`));
        const yippieConfig = JSON.parse(fileContent.toString());

        const { LogResult, Payload } = await lambda
          .invoke({
            FunctionName: artifactDeploymentFunction,
            LogType: 'Tail',
            Payload: JSON.stringify({
              ...yippieConfig,
              username,
              bucketName,
              zipFileName: `${folder}-${timestamp}.zip`,
            }),
          })
          .promise();

        verbose && console.log(Buffer.from(LogResult, 'base64').toString('utf-8'));

        const { id, productionUrl } = JSON.parse(Payload.toString());

        console.log('Updating config file ...');
        writeFileSync(join(process.cwd(), folder, `.yippie.json`), JSON.stringify({ ...yippieConfig, id }, null, 4));

        console.log(`Deployment URL: ${productionUrl}`);
        console.log('Done.');
      } catch (error) {
        console.error(error.message);
        process.exit(1);
      }
    });
  },
});
