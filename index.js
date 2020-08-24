const request = require('request-promise');
// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
const { LastBuild } = require('./lastBuild');

const { logger } = q;


class JenkinsPipelineChecker extends q.DesktopApp {
  constructor(requestParam = request) {
    super();

    this._lastResult = null; // last recorded build result for the pipeline

    this.pollingInterval = 3000; // frequency in milliseconds that Q Desktop App will run our app
    this.request = requestParam;

    // message to display in tooltip based on status
    this.MessagesForBuild = {
      SUCCESS: ' passed!',
      FAILURE: ' failed!',
      UNSTABLE: ' is unstable.',
      NOT_BUILT: ' was not built',
      BUILDING: ' building...',
      ABORTED: ' aborted.',
    };
  }

  /**
   * apply configuration changes if triggered while editing configuration in Q Desktop App
   */
  async applyConfig() {
    this.ColorsForBuild = {
      SUCCESS: this.config.successColor,
      FAILURE: this.config.failureColor,
      UNSTABLE: this.config.failureColor,
      NOT_BUILT: this.config.failureColor,
      BUILDING: this.config.buildingColor,
      ABORTED: this.config.abortedColor,
    };

    this.EffectsForBuild = {
      SUCCESS: this.config.successEffect,
      FAILURE: this.config.failureEffect,
      UNSTABLE: this.config.failureEffect,
      NOT_BUILT: this.config.failureEffect,
      BUILDING: this.config.buildingEffect,
      ABORTED: this.config.abortedEffect,
    };

    this.parseApiKeyValue(this.authorization.apiKey);

    return true;
  }

  /**
   * main entry that Q Desktop App will call at the defined interval
   */
  async run() {
    const url = `${this.jenkinsUrl}/job/${this.config.pipeline}/lastBuild/api/json`;

    // get and process build status of pipeline
    return this.request.get({
      url,
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.userToken}`).toString('base64')}`,
      },
      json: true,
    }).then((body) => {
      // we received a valid response, process it
      const lastBuild = new LastBuild(body);
      return this.hasResultChanged(lastBuild) ? this.getSignal(lastBuild) : null;
    }).catch((error) => {
      // an error occured while getting pipeline status from jenkins
      logger.error(`Error while getting job status. ${error.message}`);

      // if the error is networking related, ignore it
      if (`${error.message}`.includes('getaddrinfo')) {
        return null;
      }

      return new q.Signal({
        errors: [
          `Error while getting job status. Error detail: ${error}`,
        ],
      });
    });
  }

  /**
   * called by Q Desktop App when the configuration page loads
   * @param {string} fieldId - the id of the field on the configuration page
   */
  async options(fieldId) {
    if (fieldId === 'pipeline') {
      const url = `${this.jenkinsUrl}/api/json`;

      // get list of available pipeliens
      return this.request.get({
        url,
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.userToken}`).toString('base64')}`,
        },
        json: true,
      }).then((body) => JenkinsPipelineChecker.buildAvailableJobsForSelection(body.jobs))
        .catch((error) => {
          logger.error(`Caught error when loading jobs: ${error}`);
          return [];
        });
    }

    return [];
  }

  /**
   * process build status result and create appropriate signal
   * @param {LastBuild} lastBuild - last build result for pipeline
   */
  getSignal(lastBuild) {
    const buildStatus = JenkinsPipelineChecker.convertToStatus(lastBuild);

    const color = this.ColorsForBuild[buildStatus];
    const effect = this.EffectsForBuild[buildStatus];
    let message = this.config.pipeline;
    message += this.MessagesForBuild[buildStatus];

    const signal = new q.Signal({
      points: [[new q.Point(color, effect)]],
      name: 'Jenkins',
      message,
      link: {
        url: lastBuild.url,
        label: 'Show in Jenkins',
      },
    });

    return signal;
  }

  /**
   * checks if the build status has changed since last check
   * @param {LastBuild} lastBuild - last build result for pipeline
   */
  hasResultChanged(lastBuild) {
    let changed = false;
    const currentStatus = JenkinsPipelineChecker.convertToStatus(lastBuild);
    if (currentStatus !== this._lastResult) {
      this._lastResult = currentStatus;
      changed = true;
    }
    return changed;
  }

  /**
   * converts the status that we got from jenkins to a status we understand
   * @param {LastBuild} lastBuild
   */
  static convertToStatus(lastBuild) {
    let lastBuildStatus = lastBuild.result;
    // building status doesn't exist in Jenkins, so check boolean if the pipeline is building
    if (lastBuild.building) {
      lastBuildStatus = 'BUILDING';
    }
    return lastBuildStatus;
  }

  /**
   * creates options for configuration page based on list of  pipelines on the jenkins server
   * @param {*} jobs - array of pipelines returned from the jenkins server
   */
  static buildAvailableJobsForSelection(jobs) {
    const options = [];
    jobs.forEach((job) => {
      options.push({
        key: job.name,
        value: job.name,
      });
    });
    return options;
  }

  /**
   * parses provided Api key to it's parts
   * @param {string} apiKey
   */
  parseApiKeyValue(apiKey) {
    if (apiKey === undefined || apiKey === '') {
      return;
    }

    if (!apiKey.startsWith('http')) {
      throw new Error('Unable to parse connection string. Connection needs to use protocol of "http" or "https".');
    }

    const urlParts = apiKey.split('//');
    const protocol = urlParts[0];
    if (!urlParts[1].includes('@')) {
      throw new Error('Unable to parse connection string. Missing @ separator.');
    }

    const parts = urlParts[1].split('@');
    this.jenkinsUrl = `${protocol}//${parts[1]}`;
    this.userToken = parts[0].toString();
  }
}

module.exports = {
  JenkinsPipelineChecker,
};

// eslint-disable-next-line no-unused-vars
const applet = new JenkinsPipelineChecker();
