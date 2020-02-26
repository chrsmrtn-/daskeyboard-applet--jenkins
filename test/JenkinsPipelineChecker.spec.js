const assert = require('assert');
const { JenkinsPipelineChecker } = require('../index');

const testConfiguration = {
    jenkinsUrl: 'jenkinsServer',
    username: 'username',
    token: 'token',
    pipeline: 'pipeline',
    successColor: "#00FF00",
    successEffect: "SET_COLOR",
    failureColor: "#FF0000",
    failureEffect: "SET_COLOR",
    buildingColor: "#0000FF",
    buildingEffect: "SET_COLOR",
    abortedColor: "#C0C0C0",
    abortedEffect: "SET_COLOR"
};

describe('JenkinsPipelineChecker', function () {
    let jenkinsApiResponse = { building: false, result: 'SUCCESS', url: 'url to pipeline' };
    let sut;
    describe('#run()', () => {
        before(function () {
            sut = buildApp(jenkinsApiResponse);
        });

        it('should return the appropriate signal color for a successful pipeline', async () => {
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].color, testConfiguration.successColor, "Did not get the expected successful color.");
            });
        });

        it('should return the appropriate signal effect for a successful pipeline', async () => {
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].effect, testConfiguration.successEffect, "Did not get the expected successful effect");
            });
        });

        it('should return the appropriate signal message for a successful pipeline', async () => {
            return sut.run().then((signal) => {
                assert.ok(signal.message.includes('passed'), "Message didn't indicate if the pipeline passed");
                assert.ok(signal.message.includes(testConfiguration.pipeline), "Message didn't include pipeline name");
            });
        });

        it('should return the appropriate signal color for a failed pipeline', async () => {
            jenkinsApiResponse.result = 'FAILURE';
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].color, testConfiguration.failureColor, "Did not get the expected failure color.");
            });
        });

        it('should return the appropriate signal effect for a failed pipeline', async () => {
            jenkinsApiResponse.result = 'FAILURE';
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].effect, testConfiguration.failureEffect, "Did not get the expected failure effect");
            });
        });

        it('should return the appropriate signal message for a failed pipeline', async () => {
            jenkinsApiResponse.result = 'FAILURE';
            return sut.run().then((signal) => {
                assert.ok(signal.message.includes('failed'), "Message didn't indicate if the pipeline failed");
                assert.ok(signal.message.includes(testConfiguration.pipeline), "Message didn't include pipeline name");
            });
        });

        it('should return the appropriate signal color for a aborted pipeline', async () => {
            jenkinsApiResponse.result = "ABORTED";
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].color, testConfiguration.abortedColor, "Did not get the expected aborted color.");
            });
        });

        it('should return the appropriate signal effect for a aborted pipeline', async () => {
            jenkinsApiResponse.result = "ABORTED";
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].effect, testConfiguration.abortedEffect, "Did not get the expected aborted effect");
            });
        });

        it('should return the appropriate signal message for a aborted pipeline', async () => {
            jenkinsApiResponse.result = "ABORTED";
            return sut.run().then((signal) => {
                assert.ok(signal.message.includes('aborted'), "Message didn't indicate if the pipeline aborted");
                assert.ok(signal.message.includes(testConfiguration.pipeline), "Message didn't include pipeline name");
            });
        });

        it('should return the appropriate signal color for a building pipeline', async () => {
            jenkinsApiResponse.building = true;
            jenkinsApiResponse.result = null;
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].color, testConfiguration.buildingColor, "Did not get the expected building color.");
            });
        });

        it('should return the appropriate signal effect for a building pipeline', async () => {
            jenkinsApiResponse.building = true;
            jenkinsApiResponse.result = null;
            return sut.run().then((signal) => {
                assert.equal(signal.points[0][0].effect, testConfiguration.failureEffect, "Did not get the expected building effect");
            });
        });

        it('should return the appropriate signal message for a building pipeline', async () => {
            jenkinsApiResponse.building = true;
            jenkinsApiResponse.result = null;
            return sut.run().then((signal) => {
                assert.ok(signal.message.includes('building'), "Message didn't indicate if the pipeline is building");
                assert.ok(signal.message.includes(testConfiguration.pipeline), "Message didn't include pipeline name");
            });
        });

        it('should return the appropriate signal link for a pipeline', async () => {
            return sut.run().then((signal) => {
                assert.equal(signal.link.url, 'url to pipeline', "Did not get the expected successful effect");
            });
        });
    });
});

function buildApp(response, rejection) {
    let fakeRequest = { get:  function() {
        return buildResponsePromise(response, rejection);
    }}
    let app = new JenkinsPipelineChecker(fakeRequest);
    app.config = testConfiguration;
    app.applyConfig();

    return app;
}

function buildResponsePromise(response, rejection){
    let responsePromise;
    if (response) {
        responsePromise = new Promise((resolve, reject) => {
            resolve(response);
        });
    } else {
        responsePromise = new Promise((resolve, reject) => {
            reject(rejection);
        });
    }
    return responsePromise;
}