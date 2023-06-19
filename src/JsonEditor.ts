import * as fs from 'fs';
import { Utils } from './Utils';
import * as _ from 'lodash';
import { AlreadyExistingKeyError, NoFileFoundError, ValueAlreadyExistsError } from './Errors';

type JsonEditorConfig = {
  targetPath: string;
  text: string;
  key: string;
  replacementTemplate: string;
  keyCase: 'uppercase' | 'camelcase';
};

type TextJson = { [key: string]: any } | null;

class JsonEditor {

  private readonly targetPath: string;
  private readonly text: string;
  private readonly key: string;
  private readonly utils: Utils;
  private readonly replacementTemplate: string;
  private readonly format: 'uppercase' | 'camelcase';

  constructor(config: JsonEditorConfig = {
    targetPath: '',
    text: '',
    key: '',
    replacementTemplate: '',
    keyCase: 'camelcase',
  }, utils: Utils = new Utils()
  ) {
    this.utils = utils;
    this.text = config.text;
    this.targetPath = config.targetPath;
    this.format = config.keyCase;
    this.replacementTemplate = config.replacementTemplate;
    this.key = this.formatKeyToConfiguredFormat(config.key, this.format);
    this.json = this.readJSONFile(this.targetPath);
  }

  json: TextJson = null;

  public updateJSONFile(): string {
    if (!this.fileExists()) {
      throw new NoFileFoundError(this.targetPath);
    }

    const keyAlreadyExists = _.has(this.json, this.key);
    if (keyAlreadyExists) {
      throw new AlreadyExistingKeyError(this.key);
    }

    const valueAlreadyExists = this.valueAlreadyExists(this.json, this.text, this.key);
    if (valueAlreadyExists) {
      const nestedObject = this.getNestedObject(this.json, this.key);
      const alreadyExistingKey = _.findKey(nestedObject, (v) => v === this.text) || '';
      throw new ValueAlreadyExistsError(alreadyExistingKey, this.text);
    }

    const updatedJSON = _.set(this.json || {}, this.key, this.formatAndInlineText(this.text));

    this.updateFile(updatedJSON);
    return this.keyTemplateReplacement(this.key, this.replacementTemplate);
  };

  public getReplacementTemplate() {
    const isRootLevel = this.key.split('.').length === 1;
    const object = isRootLevel ? this.json : this.getNestedObject(this.json, this.key);
    const alreadyExistingKey = _.findKey(object, (v) => v === this.text) || '';
    return this.keyTemplateReplacement(alreadyExistingKey, this.replacementTemplate);
  }

  public fileExists(): boolean {
    return this.json !== null;
  }

  private valueAlreadyExists(file: TextJson, value: string, key: JsonEditorConfig['key']): boolean {
    const isRootLevel = key.split('.').length === 1;
    const object = isRootLevel ? file : this.getNestedObject(file, key);
    const valueAlreadyExists = _.findKey(object, (v) => v === value);
    return !!valueAlreadyExists;
  }

  private getNestedObject(file: TextJson, key: JsonEditorConfig['key']): TextJson {
    const pathWithoutLastKey = key.split('.').slice(0, -1).join('.');
    const object = _.get(file, pathWithoutLastKey);
    return object;
  }

  private updateFile(file: TextJson): void {
    const data = JSON.stringify(file, null, 4);
    fs.writeFileSync(this.targetPath, data);
    return;
  };

  private formatAndInlineText(text: string): string {
    const textWithoutMultiSpaces = text.replace(/\s\s+/g, ' ');
    const textWithoutNewLines = textWithoutMultiSpaces.replace(/\n/g, '');
    return textWithoutNewLines;
  };

  private readJSONFile(path: JsonEditor['targetPath']): TextJson {
    try {
      const data = fs.readFileSync(path, 'utf8');
      const file = JSON.parse(data);
      return file;
    } catch (error) {
      return null;
    }
  };

  private formatKeyToConfiguredFormat(value: string, format: JsonEditor["format"]): string {
    const keys = value.split('.');
    const formattedKeys = keys.map((key) => {
      switch (format) {
        case "camelcase":
          return this.utils.toCamelCase(key);
        case "uppercase":
          return key.toUpperCase();
        default:
          return key;
      }
    });
    return formattedKeys.join('.');
  }

  private keyTemplateReplacement(key: JsonEditor["key"], replacement: JsonEditor["replacementTemplate"]): string {
    if (!replacement) {
      return key;
    }

    const template = replacement;
    const splittedKey = key.split('.');
    const finalKey = splittedKey.length > 1 ? splittedKey[splittedKey.length - 1] : key;
    const updatedKey = template.replace(/\$VAR\$/g, finalKey);
    return updatedKey;
  }

}

export { JsonEditor, JsonEditorConfig };