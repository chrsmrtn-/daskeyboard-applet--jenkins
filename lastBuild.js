class LastBuild {
    constructor(object) {
        this._building = object.building;
        this._result = object.result;
        this._url = object.url;
    }

    get building() { return this._building; }

    get result() {return this._result; }

    get url() { return this._url; }
}

module.exports = { LastBuild };