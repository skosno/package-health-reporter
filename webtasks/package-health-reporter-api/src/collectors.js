const axios = require('axios');

/**
 * COLLECT DATA
 */

function collectNpmData(url, name) {
  const parsedName = name[0] === '@' ? name.replace('/', '%2f') : name;
  function RepositoryNotFoundError(message) {
    this.name = 'RepositoryNotFoundError';
    this.message = message;
  }
  RepositoryNotFoundError.prototype = new Error();

  return axios
    .get(`${url}/${parsedName}`)
    .then(npmResponse => {
      return npmResponse.data;
    })
    .catch(err => {
      if (err && err.response && err.response.status === 404) {
        throw new RepositoryNotFoundError(`Repository not found: [npm]${name}`);
      } else throw err;
    });
}

function collectGitData(url, name) {
  return Promise.all([
    axios.get(`${url}/repos/${name}`),
    axios.get(`${url}/repos/${name}/stats/commit_activity`),
  ]).then(allData => ({
    repos: allData[0].data,
    commitActivity: allData[1].data,
  }));
}

module.exports = {
  collectGitData,
  collectNpmData,
};
