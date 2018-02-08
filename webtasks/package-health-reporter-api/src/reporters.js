const moment = require('moment');
const reportConfig = require('./config').reportConfig;

/**
 * GENERAL HELPERS
 */

function getProjectSize(size) {
  return (
    (size > reportConfig.issues.sizes[1] && 'big') ||
    (size > reportConfig.issues.sizes[0] && 'medium') ||
    'small'
  );
}

/**
 * REPORETERS
 */

function reportActivity(data) {
  const issues = [];

  if (data.lastReleaseTime && typeof data.lastReleaseTime === 'string') {
    const diff = moment().diff(data.lastReleaseTime, reportConfig.activity.minRelease.format);

    if (data.lastReleaseTime && diff > reportConfig.activity.minRelease.value) {
      issues.push({
        category: 'activity',
        type: reportConfig.activity.minRelease.type,
        message: `Package hasn't been updated recenty. Latest release was done: ${moment(
          data.lastReleaseTime
        ).fromNow()}`,
      });
    }
  }

  if (data.commitActivity && data.commitActivity.length) {
    const size = getProjectSize(data.size);
    const activityInPeriod = data.commitActivity
      .slice(0, reportConfig.activity.period[size].weeks - 1)
      .reduce((sum, activity) => sum + activity, 0);

    if (activityInPeriod < reportConfig.activity.period[size].min) {
      issues.push({
        category: 'activity',
        type: reportConfig.activity.period[size].type,
        message: `Development on the package does not seem to be very active. Over past ${
          reportConfig.activity.period[size].weeks
        } weeks there have been ${activityInPeriod} commits (min. ${
          reportConfig.activity.period[size].min
        })`,
      });
    }
  } else {
    issues.push({
      category: 'activity',
      type: reportConfig.activity.period.type,
      message:
        'There is no commit activity data available. ' +
        'It is highly probable that it is still being calculated - retry in couple of seconds.',
    });
  }

  return issues;
}

function reportInterest(data) {
  const issues = [];

  if (typeof data.forksCount === 'number' || typeof data.watchersCount === 'number') {
    return issues;
  }

  if (
    data.forksCount < reportConfig.interest.minForks ||
    data.watchersCount < reportConfig.interest.minWatchers
  ) {
    issues.push({
      category: 'interest',
      type: reportConfig.interest.type,
      message: `It seems that project does not meet minimal interest criteria: forks: ${
        data.forksCount
      } (min. ${reportConfig.interest.minForks}), watchers: ${data.watchersCount} (min. ${
        reportConfig.interest.minWatchers
      })`,
    });
  }

  return issues;
}

function reportRepoIssues(data) {
  const issues = [];

  if (typeof data.size !== 'number' || typeof data.openIssuesCount !== 'number') {
    return issues;
  }

  const size = getProjectSize(data.size);

  if (data.openIssuesCount > reportConfig.issues.open[size].max) {
    issues.push({
      category: 'repoIssues',
      type: reportConfig.issues.open[size].type,
      message: `There seems to be a lot of issues open for the package: ${
        data.openIssuesCount
      } (max. ${
        reportConfig.issues.open[size].max
      }). Make sure that the package is in good shape before using it (issues count will be higher in large packages).`,
    });
  }

  return issues;
}

function reportLicense(data) {
  const issues = [];

  if (typeof data.license !== 'string') {
    return issues;
  }

  const licenses = data.license
    .replace(/\(|\)/g, '')
    .split('OR')
    .map(license => license.replace(/ /g, ''));

  if (licenses.length === 1 && reportConfig.license.alert.indexOf(licenses[0]) > -1) {
    issues.push({
      category: 'license',
      type: 'alert',
      message: `Single provided license is unacceptable: ${licenses[0]}`,
    });
  } else if (!reportConfig.license.accepted.some(license => licenses.indexOf(license) > -1)) {
    issues.push({
      category: 'license',
      type: 'warning',
      message: `Provided license(s) should be reviewed if acceptable: ${data.license}`,
    });
  }

  return issues;
}

function reportMaintainers(data) {
  const issues = [];

  if (typeof data.noOfMaintainers !== 'number') {
    return issues;
  }

  if (data.noOfMaintainers < reportConfig.maintainers.min) {
    issues.push({
      category: 'maintainers',
      type: reportConfig.maintainers.type,
      message: `There should be at least ${
        reportConfig.maintainers.min
      } maintainers to make sure that package is actively maintained. There are only: ${
        data.noOfMaintainers
      } at the moment`,
    });
  }

  return issues;
}

function reportSize(data) {
  const issues = [];

  if (typeof data.size !== 'number') {
    return issues;
  }

  if (data.size < reportConfig.size.min) {
    issues.push({
      category: 'size',
      type: reportConfig.size.type,
      message: `It seems that the package is pretty small, verify if you really want to use such small package. Package is: ${
        data.size
      } (min. is: ${reportConfig.size.min}`,
    });
  }

  return issues;
}

function reportStars(data) {
  const issues = [];

  if (typeof data.starsCount !== 'number') {
    return issues;
  }

  if (data.starsCount < reportConfig.stars.min) {
    issues.push({
      category: 'stars',
      type: reportConfig.stars.type,
      message: `Number of stars for project is: ${data.starsCount} (min. is set to: ${
        reportConfig.stars.min
      })`,
    });
  }

  return issues;
}

function reportVersion(data) {
  const issues = [];

  if (data.version === undefined) {
    return issues;
  }

  const currentVersion = parseFloat(data.version);

  if (currentVersion < reportConfig.version.min) {
    issues.push({
      category: 'version',
      type: reportConfig.version.type,
      message: `Version should be at least: ${reportConfig.version.min}. Package is: ${
        data.version
      }`,
    });
  }

  return issues;
}

function createReport(data) {
  return {
    status: 'ok',
    extractedData: data,
    report: [].concat(
      reportActivity(data),
      reportInterest(data),
      reportLicense(data),
      reportMaintainers(data),
      reportSize(data),
      reportStars(data),
      reportVersion(data),
      reportRepoIssues(data)
    ),
  };
}

module.exports = {
  createReport,
};
