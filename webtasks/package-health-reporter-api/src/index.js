const collectors = require('./collectors');
const extractors = require('./extractors');
const reporters = require('./reporters');
const config = require('./config');

/**
 * MAIN
 */

module.exports = function(ctx, cb) {
  const typeRaw = ctx.data.type;
  const rawName = decodeURIComponent(ctx.data.name);

  const repository = config.repositoryUrls[typeRaw];
  if (!repository || repository.type !== 'npm') {
    return cb(new Error('Unsupported package source'));
  }

  collectors
    .collectNpmData(repository.url, rawName)
    .then(npmData => {
      const codeRepository = npmData.repository;
      if (codeRepository && codeRepository.type === 'git') {
        const gitName = codeRepository.url.match(config.gitUrlRegexp)[1];
        return collectors
          .collectGitData(config.repositoryUrls['git'].url, gitName)
          .then(gitData => ({
            npm: npmData,
            git: gitData,
          }));
      }

      return {
        npm: npmData,
      };
    })
    .then(extractors.extractData)
    .then(reporters.createReport)
    .then(report => {
      cb(null, report);
    })
    .catch(err => {
      cb(err);
    });
};
