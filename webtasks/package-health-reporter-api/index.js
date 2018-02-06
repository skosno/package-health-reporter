const axios = require('axios@0.17.1');

const REPOSITORY_URLS = Object.create(null, {
  npm: { value: { type: 'npm', url: 'https://registry.npmjs.org' } },
  git: { value: { type: 'git', url: 'https://api.github.com' } },
});
const GIT_URL_REGEXP = /github\.com\/(.*)\.git/;
const reportConfig = {
  maintainers: {
    min: 2,
  },
  license: {
    accepted: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'WTFPL'],
    alert: ['UNLICENSED'],
  },
};

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

function extractFromNpm(npmData) {
  if (!npmData) {
    return {};
  }

  return {
    license: npmData.license,
    version: npmData['dist-tags'].latest,
    noOfMaintainers: npmData.maintainers.length,
    lastReleaseTime: npmData.time.modified,
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
      type: 'warning',
      message: `There should be at least ${
        reportConfig.maintainers.min
      } maintainers. There are only: data.noOfMaintainers`,
    });
  }
  return issues;
}

function createReport(data) {
  return {
    status: 'ok',
    extractedData: data,
    report: {
      license: reportLicense(data),
      maintainers: reportMaintainers(data),
    },
  };
}

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
