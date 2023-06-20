class LocalErrors extends Error { }


class AlreadyExistingKeyError extends LocalErrors {
    constructor(key: string) {
        super(`Key: ${key} already exists`);
    }
}

class ValueAlreadyExistsError extends LocalErrors {
    constructor(key: string, value: string) {
        super(`Value: ${value} already exists for key: ${key} , on Close key will be copied to clipboard`);
    }
}

class NoFileFoundError extends LocalErrors {
    constructor(path: string) {
        super(`No file found at path: ${path}`);
    }

}

class TooManyProjectFoldersError extends LocalErrors {
    constructor() {
        super('Too many project folders found');
    }
}

export { AlreadyExistingKeyError, ValueAlreadyExistsError, NoFileFoundError, LocalErrors, TooManyProjectFoldersError };