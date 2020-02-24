const request = require('request-promise');

// Library to send signal to Q keyboards
const q = require('daskeyboard-applet');
const logger = q.logger;


class JenkinsPipelineChecker extends q.DesktopApp
{
    constructor() {
        super();
        // run every 3000 ms
        this.pollingInterval = 3000;
        logger.info('Jenkins ready to go!');
    }

    async run() {
        let url = this.config.jenkinsUrl + '/job/' + this.config.pipeline + '/lastBuild/api/json';

        return request.get({
            url: url,
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${this.config.username}:${this.config.token}`).toString('base64')
            },
            json: true
        }).then((body) => {
            let color = this.getColor(body, this.config);
            let effect = this.getEffect(body, this.config);
            let message = this.config.pipeline;
            message += this.getStatusMessage(body);

            let signal = new q.Signal({
                points: [[new q.Point(color, effect)]],
                name: "Jenkins",
                message: message,
                link: {
                url: body.url,
                label: 'Show in Jenkins',
                }
            });
            return signal;
        });
    }

    getColor(body, config)
    {
        let color = config.failureColor;

        if (body.building === true)
        {
            color = config.buildingColor;
        }
        else if(body.result == 'SUCCESS')
        {
            color = this.config.successColor;
        }
        
        return color;
    }

    getEffect(body, config)
    {
        let effect = config.failureEffect;
        
        if (body.building === true){
            effect = config.buildingEffect;
        }
        else if(body.result == 'SUCCESS')
        {
            effect = this.config.successEffect;
        }
        
        return effect;
    }

    getStatusMessage(body)
    {
        let status = ' failed!';
        
        if (body.building === true)
        {
            status = ' building...';
        }
        else if(body.result == 'SUCCESS')
        {
            status = ' passed!';
        }

        return status;
    }
    
}

module.exports = {
    JenkinsPipelineChecker: JenkinsPipelineChecker
}

const applet = new JenkinsPipelineChecker();
