// import { join } from 'path';
// import { Amplify, Auth, Storage } from 'aws-amplify';

// Amplify.configure({
//   Auth: {
//     region: 'eu-central-1',
//     identityPoolId: 'eu-central-1:77ff16f7-ab5d-4c34-a59b-c717ac4ac91a',
//     userPoolId: 'eu-central-1_C8jzBTFj9',
//     userPoolWebClientId: '3g7kt3o684n7u561a38v1411gs',
//     mandatorySignIn: true,
//   },
//   Storage: {
//     AWSS3: {
//       bucket: 'yippiecloud-artifacts',
//       region: 'eu-central-1',
//     },
//   },
// });

// (async () => {
//   await signIn();
//   await uploadFile();
// })();

// async function signIn() {
//   try {
//     const user = await Auth.signIn('mike.bild@gmail.com', '..Galaxy007..');
//     console.log({ user });
//   } catch (error) {
//     console.log('error signing in', error);
//   }
// }

// async function uploadFile() {
//   Storage.put('test.txt', 'Hello World!', {
//     level: 'private',
//     contentType: 'text/plain',
//     progressCallback(progress: any) {
//       console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
//     },
//   });
// }
