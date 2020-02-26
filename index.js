const request = require('request-promise');
const { LastBuild }  = require('./lastBuild')

// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
const logger = q.logger;


class JenkinsPipelineChecker extends q.DesktopApp
{
    constructor(requestParam = request) {
        super();
        this.pollingInterval = 3000;
        this._request = requestParam;

        this.MessagesForBuild = {
            SUCCESS: " passed!",
            FAILURE: " failed!",
            BUILDING: " building...",
            ABORTED: " aborted."
        }
    }

    async applyConfig() {
        this.ColorsForBuild = {
            SUCCESS: this.config.successColor,
            FAILURE: this.config.failureColor,
            BUILDING: this.config.buildingColor,
            ABORTED: this.config.abortedColor
        }

        this.EffectsForBuild = {
            SUCCESS: this.config.successEffect,
            FAILURE: this.config.failureEffect,
            BUILDING: this.config.buildingEffect,
            ABORTED: this.config.abortedEffect
        }
    }

    async run() {
        let url = this.config.jenkinsUrl + '/job/' + this.config.pipeline + '/lastBuild/api/json';

        return this._request.get({
            url: url,
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.config.username}:${this.config.token}`).toString('base64')
            },
            json: true
        }).then((body) => {
            let lastBuild = new LastBuild(body);
            return this.getSignal(lastBuild);
        });
    }

    getColor(lastBuild, config)
    {
        let color;
        let lastBuildStatus = this.convertToStatus(lastBuild);

        if (Object.keys(this.ColorsForBuild).includes(lastBuildStatus)) {
            color = this.ColorsForBuild[lastBuildStatus];
        } else {
            color = `Build state of ${lastBuild.result} not recognized`;
        }

        return color;
    }

    getEffect(lastBuild, config)
    {
        let effect;
        let lastBuildStatus = this.convertToStatus(lastBuild);

        if (Object.keys(this.EffectsForBuild).includes(lastBuildStatus)) {
            effect = this.EffectsForBuild[lastBuildStatus];
        } else {
            effect = `Build state of ${lastBuild.result} not recognized`;
        }

        return effect;
    }

    getStatusMessage(lastBuild)
    {
        let status;
        let lastBuildStatus = this.convertToStatus(lastBuild);

        if (Object.keys(this.MessagesForBuild).includes(lastBuildStatus)) {
            status = this.MessagesForBuild[lastBuildStatus];
        } else {
            status = `Build state of ${lastBuild.result} not recognized`;
        }

        return status;
    }

    getSignal(lastBuild) {
        let color = this.getColor(lastBuild, this.config);
        let effect = this.getEffect(lastBuild, this.config);
        let message = this.config.pipeline;
        message += this.getStatusMessage(lastBuild);

        let signal = new q.Signal({
            points: [[new q.Point(color, effect)]],
            name: "Jenkins",
            message: message,
            link: {
                url: lastBuild.url,
                label: 'Show in Jenkins',
            }
        });
        return signal;
    }

    convertToStatus(lastBuild) {
        let lastBuildStatus = lastBuild.result;
        if (lastBuild.building) {
            lastBuildStatus = "BUILDING";
        }
        return lastBuildStatus;
    }
    
}

module.exports = {
    JenkinsPipelineChecker: JenkinsPipelineChecker
}

const applet = new JenkinsPipelineChecker();
