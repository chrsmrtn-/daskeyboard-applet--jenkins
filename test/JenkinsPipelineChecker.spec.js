/* eslint-disable no-undef */
const assert = require('assert');
const { JenkinsPipelineChecker } = require('../index');

const testConfiguration = {
  authorization: {
    apiKey: 'http://1:1@host',
  },
  applet: {
    user: {
      pipeline: 'pipeline',
      successColor: '#00FF00',
      successEffect: 'SET_COLOR',
      failureColor: '#FF0000',
      failureEffect: 'SET_COLOR',
      buildingColor: '#0000FF',
      buildingEffect: 'SET_COLOR',
      abortedColor: '#C0C0C0',
      abortedEffect: 'SET_COLOR',
    },
  },
};

function buildResponsePromise(response, error) {
  const responsePromise = new Promise((resolve, reject) => {
    if (response !== null) {
      resolve(response);
    }
    if (error !== null) {
      reject(error);
    }
  });
  return responsePromise;
}

function buildApp(fakeRequest) {
  const app = new JenkinsPipelineChecker(fakeRequest);
  app.processConfig(testConfiguration);
  app.applyConfig();

  return app;
}


describe('JenkinsPipelineChecker', () => {
  describe('the run() method', () => {
    const jenkinsApiResponse = { building: false, result: 'SUCCESS', url: 'url to pipeline' };
    let sut;
    const fakeRequest = {
      get: {},
    };

    before(() => {
      sut = buildApp(fakeRequest);
    });

    it('should return the appropriate signal color for a successful pipeline', async () => {
      sut._lastResult = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      sut.run().then((signal) => {
        assert.equal(signal.points[0][0].color, testConfiguration.applet.user.successColor, 'Did not get the expected successful color.');
      });
    });

    it('should return the appropriate null signal for unchanged pipeline status', async () => {
      sut._lastResult = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      await sut.run();
      const signal = await sut.run();

      assert.equal(null, signal, 'Did not get the expected null signal.');
    });

    it('should return the appropriate signal effect for a successful pipeline', async () => {
      sut._lastResult = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].effect, testConfiguration.applet.user.successEffect, 'Did not get the expected successful effect.');
    });

    it('should return the appropriate signal message for a successful pipeline', async () => {
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.ok(signal.message.includes('passed'), 'Message did not indicate if the pipeline passed');
      assert.ok(signal.message.includes(testConfiguration.applet.user.pipeline), 'Message did not include pipeline name.');
    });

    it('should return the appropriate signal color for a failed pipeline', async () => {
      jenkinsApiResponse.result = 'FAILURE';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].color, testConfiguration.applet.user.failureColor, 'Did not get the expected failure color.');
    });

    it('should return the appropriate signal effect for a failed pipeline', async () => {
      jenkinsApiResponse.result = 'FAILURE';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].effect, testConfiguration.applet.user.failureEffect, 'Did not get the expected failure effect.');
    });

    it('should return the appropriate signal message for a failed pipeline', async () => {
      jenkinsApiResponse.result = 'FAILURE';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.ok(signal.message.includes('failed'), 'Message did not indicate if the pipeline failed');
      assert.ok(signal.message.includes(testConfiguration.applet.user.pipeline), 'Message did not include pipeline name.');
    });

    it('should return the appropriate signal color for a aborted pipeline', async () => {
      jenkinsApiResponse.result = 'ABORTED';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].color, testConfiguration.applet.user.abortedColor, 'Did not get the expected aborted color.');
    });

    it('should return the appropriate signal effect for a aborted pipeline', async () => {
      jenkinsApiResponse.result = 'ABORTED';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].effect, testConfiguration.applet.user.abortedEffect, 'Did not get the expected aborted effect.');
    });

    it('should return the appropriate signal message for a aborted pipeline', async () => {
      jenkinsApiResponse.result = 'ABORTED';
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.ok(signal.message.includes('aborted'), 'Message did not indicate if the pipeline aborted');
      assert.ok(signal.message.includes(testConfiguration.applet.user.pipeline), 'Message did not include pipeline name.');
    });

    it('should return the appropriate signal color for a building pipeline', async () => {
      jenkinsApiResponse.building = true;
      jenkinsApiResponse.result = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].color, testConfiguration.applet.user.buildingColor, 'Did not get the expected building color.');
    });

    it('should return the appropriate signal effect for a building pipeline', async () => {
      jenkinsApiResponse.building = true;
      jenkinsApiResponse.result = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.points[0][0].effect, testConfiguration.applet.user.failureEffect, 'Did not get the expected building effect.');
    });

    it('should return the appropriate signal message for a building pipeline', async () => {
      jenkinsApiResponse.building = true;
      jenkinsApiResponse.result = null;
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.ok(signal.message.includes('building'), 'Message did not indicate if the pipeline is building');
      assert.ok(signal.message.includes(testConfiguration.applet.user.pipeline), 'Message did not include pipeline name.');
    });

    it('should return the appropriate signal link for a pipeline', async () => {
      fakeRequest.get = function tGet() { return buildResponsePromise(jenkinsApiResponse); };

      const signal = await sut.run();

      assert.equal(signal.link.url, 'url to pipeline', 'Did not get the expected successful effect.');
    });

    it('should return the appropriate signal for promise reject on get job status', async () => {
      const error = new Error('99 problems and this error is one of them');
      fakeRequest.get = function tGet() { return buildResponsePromise(null, error); };

      const signal = await sut.run();

      assert.ok(signal.errors[0].includes(error.message), 'Did not get the expected error message in error signal.');
    });

    it('should return the appropriate null for promise reject on get job status related to networking issues', async () => {
      const error = new Error('getaddrinfo');
      fakeRequest.get = function tGet() { return buildResponsePromise(null, error); };

      const signal = await sut.run();

      assert.equal(signal, null, 'Did not get the expected error message in error signal.');
    });

    it('should properly parse user token from a valid key value', () => {
      assert.equal(sut.userToken, '1:1', 'User token ws not properly parsed.');
    });

    it('should properly parse server url from a valid key value', () => {
      assert.equal(sut.jenkinsUrl, 'http://host', 'Server url was not properly parsed.');
    });
  });

  describe('the parseApiKeyValue() method', () => {
    let sut;
    const fakeRequest = {
      get: {},
    };

    before(() => {
      sut = buildApp(fakeRequest);
    });

    it('properly throws exception when unable to detect proper protocol', () => {
      assert.throws(() => {
        sut.parseApiKeyValue('user:token@host');
      },
      {
        message: /^Unable to parse connection string.*protocol.*$/,
      });
    });

    it('properly throws exception when unable to detect token and host separator, @', () => {
      assert.throws(() => {
        sut.parseApiKeyValue('http://user:tokenhost');
      },
      {
        message: /^Unable to parse connection string.*@.*$/,
      });
    });

    it('should not perform parsing when passed undefined', () => {
      sut.parseApiKeyValue(undefined);
      assert.equal(sut.jenkinsUrl, 'http://host', 'Url was unexpectedly adjusted');
      assert.equal(sut.userToken, '1:1', 'Token was unexpectedly adjusted');
    });
  });
});
