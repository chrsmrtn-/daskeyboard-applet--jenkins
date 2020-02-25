class LastBuild {
    constructor(object) {
        this._building = object.building;
        this._result = object.result;
    }

    get building() { return this._building }

    get result() {return this._result }
}

module.exports = { LastBuild };