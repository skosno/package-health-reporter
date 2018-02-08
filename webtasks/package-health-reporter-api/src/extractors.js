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
  const commitActivity = (Array.isArray(gitData.commitActivity) && gitData.commitActivity) || [];

  return {
    license: repos.license,
    openIssuesCount: repos.open_issues_count,
    size: repos.size,
    watchersCount: repos.watchers_count,
    starsCount: repos.stargazers_count,
    forksCount: repos.forks_count,
    subscribersCount: repos.subscribers_count,
    commitActivity: commitActivity.map(activity => activity.total),
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

module.exports = {
  extractFromGit,
  extractFromNpm,
  extractData,
};
