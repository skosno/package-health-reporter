# package-health-reporter
Webtask.io based reporter for evaluating NPM modules versus set of predefined health check rules (licenses, maintainers, no. of issues and trends etc.)

The idea is to be able to asses if particular package meets some basic requirements of a "healthy package" for your organization/project.

**Please bear in mind that all the rules are subjective and by no means should be treated as "standard" or hard rules.**

## Prerequisites
This code is deployable to webtask.io with the use of [Webtask CLI](https://github.com/auth0/wt-cli). For more information on Webtask please visit [Official Webtask Documentation](https://webtask.io/docs/101).

## Deploying

There are two webtasks available in the repository:

1. [package-health-reporter-api](./webtasks/package-health-reporter-api)
2. [package-health-reporter-client](./webtasks/package-health-reporter-client)

### package-health-reporter-api
This is the main webtask responsible for agregating data and generating report based on coded rules.

Deploy it (from root directory) with command:
> wt create webtasks/package-health-reporter-api --name package-health-reporter-api

You can specify any custom name after "--name" if you desire.

### package-health-reporter-client
This is the support task that provides simple Web UI for the reporter.

**To be able to use it, you must first deploy "package-health-reporter-api" and have it's URL**

Deploy it (from root directory) with command:
>wt create package-health-reporter-client --name package-health-reporter-client --secret apiUrl=[Your package-health-reporter-api URL]

Replace *[Your package-health-reporter-api URL]* with the actual URL of previously deployed "package-health-reporter-api" webtask.

You can specify any custom name after "--name" if you desire.

## License

This project is licensed under the MIT license, Copyright (c) 2018 Szymon Kosno. For more information see [LICENSE](./LICENSE).
