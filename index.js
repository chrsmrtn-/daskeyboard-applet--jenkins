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
        let color = config.failureColor;

        if (lastBuild.building === true)
        {
            color = config.buildingColor;
        }
        else if(lastBuild.result === 'SUCCESS')
        {
            color = this.config.successColor;
        }
        
        return color;
    }

    getEffect(lastBuild, config)
    {
        let effect = config.failureEffect;
        
        if (lastBuild.building === true){
            effect = config.buildingEffect;
        }
        else if(lastBuild.result === 'SUCCESS')
        {
            effect = this.config.successEffect;
        }
        
        return effect;
    }

    getStatusMessage(lastBuild)
    {
        let status = ' failed!';
        
        if (lastBuild.building === true)
        {
            status = ' building...';
        }
        else if(lastBuild.result === 'SUCCESS')
        {
            status = ' passed!';
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
    
}

module.exports = {
    JenkinsPipelineChecker: JenkinsPipelineChecker
}

const applet = new JenkinsPipelineChecker();
