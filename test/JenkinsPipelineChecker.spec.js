const assert = require('assert');
const JenkinsPipelineChecker = require('../index').JenkinsPipelineChecker;
const { LastBuild } = require('../lastBuild');

describe('JenkinsPipelineChecker', function () {
    describe('#getColor()', () => {
        it('should return configured color for successful build', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: false,
                result: 'SUCCESS'
            });

            let color = sut.getColor(lastBuild, sut.config);
            
            assert.equal(color, getConfig().successColor, 'Did not get the expected successful color');
        });

        it('should return configured color for failed build', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: false,
                result: 'FAILURE'
            });

            let color = sut.getColor(lastBuild, sut.config);
            
            assert.equal(color, getConfig().failureColor, 'Did not get the expected failure color');
        });
        
        it('should return configured color for build that is building', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: true,
                result: null
            });

            let color = sut.getColor(lastBuild, sut.config);
            
            assert.equal(color, getConfig().buildingColor, 'Did not get the expected building color');
        });
    });

    describe('#getEffect()', () => {
        it('should return configured effect for successful build', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: false,
                result: 'SUCCESS'
            });

            let effect = sut.getEffect(lastBuild, sut.config);
            
            assert.equal(effect, getConfig().successEffect, 'Did not get the expected successful effect');
        });

        it('should return configured effect for failed build', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: false,
                result: 'FAILURE'
            });

            let effect = sut.getEffect(lastBuild, sut.config);
            
            assert.equal(effect, getConfig().failureEffect, 'Did not get the expected failure effect');
        });
        
        it('should return configured effect for build that is building', () => {
            let sut = buildApp();
            let lastBuild = new LastBuild({
                building: true,
                result: null
            });

            let effect = sut.getEffect(lastBuild, sut.config);
            
            assert.equal(effect, getConfig().buildingEffect, 'Did not get the expected building effect');
        });
    });
});

function buildApp() {
    let app = new JenkinsPipelineChecker();
    app.config = getConfig();

    return app;
}

function getConfig() {
    return {
        jenkinsUrl: 'jenkinsServer',
        username: 'username',
        token: 'token',
        pipeline: 'pipeline',
        successColor: "#00FF00",
        successEffect: "SET_COLOR",
        failureColor: "#FF0000",
        failureEffect: "SET_COLOR",
        buildingColor: "#0000FF",
        buildingEffect: "SET_COLOR"
	}
}