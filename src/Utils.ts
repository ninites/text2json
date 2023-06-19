import * as _ from 'lodash';

class Utils {
    constructor() { }

    public toCamelCase(text: string): string {
        return _.camelCase(text);
    }
}

export { Utils };