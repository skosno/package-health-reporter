const REPOSITORY_URLS = Object.create(null, {
  npm: { value: { type: 'npm', url: 'https://registry.npmjs.org' } },
  git: { value: { type: 'git', url: 'https://api.github.com' } },
});

module.exports = function(ctx, cb) {
  const typeRaw = ctx.data.type;

  const repository = REPOSITORY_URLS[typeRaw];
  if (!repository) {
    cb(new Error('Unknown Repository'));
  }

  cb(null, {
    status: 'ok',
  });
};
