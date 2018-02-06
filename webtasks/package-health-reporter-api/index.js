const axios = require('axios@0.17.1');
const moment = require('moment@2.11.2');

const REPOSITORY_URLS = Object.create(null, {
  npm: { value: { type: 'npm', url: 'https://registry.npmjs.org' } },
  git: { value: { type: 'git', url: 'https://api.github.com' } },
});
const GIT_URL_REGEXP = /github\.com\/(.*)\.git/;
const reportConfig = {
  maintainers: {
    min: 2,
    type: 'warning',
  },
  license: {
    accepted: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'WTFPL'],
    alert: ['UNLICENSED'],
  },
  size: {
    min: 38,
    type: 'warning',
  },
  version: {
    min: 0.2,
    type: 'warning',
  },
  stars: {
    min: 100,
    type: 'info',
  },
  interest: {
    minForks: 5,
    minWatchers: 3,
    type: 'warning',
  },
  issues: {
    open: {
      max: 100,
      type: 'warning',
    },
  },
  activity: {
    minRelease: {
      value: 60,
      format: 'days',
      type: 'warning',
    },
  },
};

/**
 * COLLECT DATA
 */

function collectNpmData(url, name) {
  return axios
    .get(`${url}/${name}`)
    .then(npmResponse => {
      return npmResponse.data;
    })
    .catch(() => {
      throw new Error(`Repository not found: [npm]${name}`);
    });
}

function collectGitData(url, name) {
  return axios.get(`${url}/repos/${name}`).then(reposResponse => ({
    repos: reposResponse.data,
  }));
}

/**
 * EXTRACT DATA
 */

function extractFromNpm(npmData) {
  if (!npmData) {
    return {};
  }

  return {
    name: npmData.name,
    license: npmData.license,
    version: npmData['dist-tags'].latest,
    noOfMaintainers: npmData.maintainers.length,
    lastReleaseTime: npmData.time[npmData['dist-tags'].latest],
  };
}

function extractFromGit(gitData) {
  if (!gitData) {
    return {};
  }

  const repos = gitData.repos || {};

  return {
    license: repos.license,
    openIssuesCount: repos.open_issues_count,
    size: repos.size,
    watchersCount: repos.watchers_count,
    starsCount: repos.stargazers_count,
    forksCount: repos.forks_count,
    subscribersCount: repos.subscribers_count,
  };
}

function extractData(collectedData) {
  const npmExtract = extractFromNpm(collectedData.npm);
  const gitExtract = extractFromGit(collectedData.git);
  const conflicts = {
    license: npmExtract.license || gitExtract || null,
  };

  return Object.assign({}, npmExtract, gitExtract, conflicts);
}

/**
 * REPORTERS
 */

function reportActivity(data) {
  const issues = [];
  const diff = moment().diff(data.lastReleaseTime, reportConfig.activity.minRelease.format);

  if (diff > reportConfig.activity.minRelease.value) {
    issues.push({
      type: reportConfig.activity.minRelease.type,
      message: `Package hasn't been updated recenty. Latest release was done: ${moment(
        data.lastReleaseTime
      ).fromNow()}`,
    });
  }

  return issues;
}

function reportInterest(data) {
  const issues = [];

  if (
    data.forksCount < reportConfig.interest.minForks ||
    data.watchersCount < reportConfig.interest.minWatchers
  ) {
    issues.push({
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

  if (data.openIssuesCount > reportConfig.issues.open.max) {
    issues.push({
      type: reportConfig.issues.open.type,
      message: `There seems to be a lot of issues open for the package: ${
        data.openIssuesCount
      } (max. ${
        reportConfig.issues.open.max
      }). Make sure that the package is in good shape before using it (issues count will be higher in large packages).`,
    });
  }

  return issues;
}

function reportLicense(data) {
  const issues = [];
  const licenses = data.license
    .replace(/\(|\)/g, '')
    .split('OR')
    .map(license => license.replace(/ /g, ''));

  if (licenses.length === 1 && reportConfig.license.alert.indexOf(licenses[0]) > -1) {
    issues.push({
      type: 'alert',
      message: `Single provided license is unacceptable: ${licenses[0]}`,
    });
  } else if (!reportConfig.license.accepted.some(license => licenses.indexOf(license) > -1)) {
    issues.push({
      type: 'warning',
      message: `Provided license(s) should be reviewed if acceptable: ${data.license}`,
    });
  }

  return issues;
}

function reportMaintainers(data) {
  const issues = [];

  if (data.noOfMaintainers < reportConfig.maintainers.min) {
    issues.push({
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

  if (data.size < reportConfig.size.min) {
    issues.push({
      type: reportConfig.size.type,
      message: `It seems that the package is pretty small, verify if you really want to use such small package. Package is: ${
        data.size
      } (min is: ${reportConfig.size.min}`,
    });
  }

  return issues;
}

function reportStars(data) {
  const issues = [];

  if (data.starsCount < reportConfig.stars.min) {
    issues.push({
      type: reportConfig.stars.type,
      message: `Number of stars for project is: ${data.starsCount} (min is set to: ${
        reportConfig.stars.min
      })`,
    });
  }

  return issues;
}

function reportVersion(data) {
  const issues = [];
  const currentVersion = parseFloat(data.version);

  if (currentVersion < reportConfig.version.min) {
    issues.push({
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
    report: {
      activity: reportActivity(data),
      interest: reportInterest(data),
      license: reportLicense(data),
      maintainers: reportMaintainers(data),
      size: reportSize(data),
      stars: reportStars(data),
      version: reportVersion(data),
      repoIssues: reportRepoIssues(data),
    },
  };
}

/**
 * MAIN
 */

module.exports = function(ctx, cb) {
  const typeRaw = ctx.data.type;
  const rawName = decodeURIComponent(ctx.data.name);

  const repository = REPOSITORY_URLS[typeRaw];
  if (!repository || repository.type !== 'npm') {
    return cb(new Error('Unsupported package source'));
  }

  collectNpmData(repository.url, rawName)
    .then(npmData => {
      const repository = npmData.repository;
      if (repository.type === 'git') {
        const gitName = repository.url.match(GIT_URL_REGEXP)[1];
        return collectGitData(REPOSITORY_URLS['git'].url, gitName).then(gitData => ({
          npm: npmData,
          git: gitData,
        }));
      }

      return {
        npm: npmData,
      };
    })
    .then(extractData)
    .then(createReport)
    .then(report => {
      cb(null, report);
    })
    .catch(err => {
      cb(err);
    });
};
