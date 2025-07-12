// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  defaultauth: 'fakebackend',
  quickbooks: {
    baseUrl: 'https://quickbooks.api.intuit.com/v3/company',
    realmId: '9341452050405472',
    minorVersion: '65',
    clientId: 'AB6rsRXLFdh9Upm43x639uDwBR3vfDFaVnwlUaqsplnJfmxcj4',
    clientSecret: 'OQPA7zBYEOpckOZ1tPvq1W7UQo0eIhluYHjRdmuC'
  },
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  }
};


/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
