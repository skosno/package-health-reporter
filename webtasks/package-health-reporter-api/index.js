const axios = require('axios@0.17.1');

const REPOSITORY_URLS = Object.create(null, {
  npm: { value: { type: 'npm', url: 'https://registry.npmjs.org' } },
  git: { value: { type: 'git', url: 'https://api.github.com' } },
});
const GIT_URL_REGEXP = /github\.com\/(.*)\.git/;

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
  return axios.get(`${url}/repos/${name}`).then(reposResponse => reposResponse.data);
}

function createReport(collectedData) {
  return {
    status: 'ok',
    collectedData,
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
    .then(createReport)
    .then(report => {
      cb(null, report);
    })
    .catch(err => {
      cb(err);
    });
};
