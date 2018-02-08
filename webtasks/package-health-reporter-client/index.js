'use strict';

const axios = require('axios@0.17.1');
const handlebars = require('handlebars');

const View = `
<html>
  <head>
    <title>Check the health of NPM packages</title>
    <style>
      body {
        text-align: center;
      }
      .grey-text {
        color: #9d9d9d;
      }
      .search-input {
        background-color: transparent;
        border: none;
        border-bottom: 1px solid #9d9d9d;
        border-radius: 0;
        outline: none;
        height: 2rem;
        font-size: 1rem;
        margin: 0 0 15px 0;
        padding: 0;
        box-shadow: none;
        box-sizing: content-box;
        transition: all .2s;
        width: 300px;
      }
      .search-button {
        height: 2rem;
      }
      .report-box {
        display: inline-block;
        max-width: 700px;
        text-align: left;
      }
      .report-row {
        padding: 2px 0;
        display: flex;
      }
      .category {
        display: block;
        text-align: right;
        min-width: 100px;
        margin-right: 5px;
      }
      .alert {
        color: red;
      }
      .warning {
        color: orange;
      }
      .info {
        color: blue;
      }
      .success {
        color: green;
      }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  </head>
  <body>
    <form method="get">
      <h1 class="grey-text">What is the health of NPM package?</h1>
      <input type="text" value="{{packageName}}" name="packageName" placeholder="e.g. angular" class="search-input"/>
      <button type="submit" class="search-button">Check</button>
    </form>
    {{#if error}}
      <strong>{{error}}</strong>
    {{else}}
      <h2>Report</h2>
      <div class="report-box">
        {{#each report}}
          <div class="report-row">
            <div class="category grey-text">[{{category}}]</div>
            <span class="{{type}}">{{message}}</span>
          </div>
        {{/each}}      
      </div>
      {{#if empty}}
        <strong class="success">No issues found!</strong>
      {{/if}}
    {{/if}}
  </body>
</html>
`;

module.exports = function(ctx, req, res) {
  const packageName = ctx.data.packageName;
  const apiUrl = ctx.secrets.apiUrl;

  const template = handlebars.compile(View);

  axios
    .get(`${apiUrl}?type=npm&name=${packageName}`)
    .then(response => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        template({
          packageName,
          report: response.data.report,
          empty: !response.data.report.length,
        })
      );
    })
    .catch(err => {
      const name = err.response.data.name;
      const message = err.response.data.message;
      let error = `There was an unknown error when generating report: ${message}`;
      if (name === 'RepositoryNotFoundError') {
        error = message;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        template({
          packageName,
          report: null,
          error,
        })
      );
    });
};
