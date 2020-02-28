const request = require('request-promise');
const { LastBuild }  = require('./lastBuild');

// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
const logger = q.logger;


class JenkinsPipelineChecker extends q.DesktopApp
{
    constructor(requestParam = request) {
        super();
        this.pollingInterval = 3000;
        this._request = requestParam;
        
        this.jenkinsUrl;
        this.userToken;

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
        
        try {
            this.parseApiKeyValue();
        } catch (ex) {
            logger.error(ex.message);
        }
        
    }

    async run() {
        let url = this.jenkinsUrl + '/job/' + this.config.pipeline + '/lastBuild/api/json';

        return this._request.get({
            url: url,
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.userToken}`).toString('base64')
            },
            json: true
        }).then((body) => {
            let lastBuild = new LastBuild(body);
            return this.getSignal(lastBuild);
        });
    }

    async options(fieldId) {
        if (fieldId === 'pipeline') {
            let url = this.jenkinsUrl + '/api/json';
    
            return this._request.get({
                url: url,
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${this.userToken}`).toString('base64')
                },
                json: true
            }).then(body => {
                return this.buildJobs(body.jobs);
            }).catch(error => {
                logger.error(`Caught error when loading jobs: ${error}`);
                return [ ];
            });
        }
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

    buildJobs(jobs) {
        let options = [];
        jobs.forEach(job => {
            options.push({
                key: job.name,
                value: job.name
            })
        });
        return options;
    }

    parseApiKeyValue(){
        if (!this.authorization.apiKey.startsWith('http')) {
            throw new Errow('Unable to parse connection string. Connection needs to use protocol of "http" or "https".');
        }

        let urlParts = this.authorization.apiKey.split('//');
        let protocol = urlParts[0];
        if (!urlParts[1].includes('@')) {
            throw new Error('Unable to parse connection string. Missing @ separator.');
        }

        let parts = urlParts[1].split('@');
        this.jenkinsUrl = protocol + '//' + parts[1];
        this.userToken = parts[0];
    }
    
}

module.exports = {
    JenkinsPipelineChecker: JenkinsPipelineChecker
}

const applet = new JenkinsPipelineChecker();
