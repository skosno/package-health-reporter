const repositoryUrls = Object.create(null, {
  npm: { value: { type: 'npm', url: 'https://registry.npmjs.org' } },
  git: { value: { type: 'git', url: 'https://api.github.com' } },
});
const gitUrlRegexp = /github\.com\/(.*)\.git/;
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
    sizes: [250, 72000],
    open: {
      small: {
        max: 20,
        type: 'warning',
      },
      medium: {
        max: 120,
        type: 'warning',
      },
      big: {
        max: 380,
        type: 'warning',
      },
    },
  },
  activity: {
    minRelease: {
      value: 90,
      format: 'days',
      type: 'warning',
    },
    period: {
      type: 'warning',
      small: {
        weeks: 12,
        min: 2,
        type: 'warning',
      },
      medium: {
        weeks: 12,
        min: 50,
        type: 'warning',
      },
      big: {
        weeks: 12,
        min: 85,
        type: 'warning',
      },
    },
  },
};

module.exports = {
  repositoryUrls,
  gitUrlRegexp,
  reportConfig,
};
