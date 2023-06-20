import * as fs from 'fs';
import * as _ from 'lodash';
import { Utils } from './Utils';
import { AlreadyExistingKeyError, NoFileFoundError, TooManyProjectFoldersError, ValueAlreadyExistsError } from './Errors';

type TextJson = { [key: string]: any } | null;
type JsonEditorConfig = {
  text: string;
  key: string;
  keyCase: 'uppercase' | 'camelcase';
  filePath: string;
  parameters: { [key: string]: any };
};



class JsonEditor {

  private readonly text: string;
  private readonly key: string;
  private readonly utils: Utils;
  private readonly format: 'uppercase' | 'camelcase';
  private readonly filePath: string;
  private readonly replacementTemplate: string;
  private readonly targetPath: string;

  constructor(
    config: JsonEditorConfig = {
      text: '',
      key: '',
      keyCase: 'camelcase',
      filePath: '',
      parameters: {},
    },
    utils: Utils = new Utils()
  ) {
    this.utils = utils;
    this.text = config.text;
    this.format = config.keyCase;
    this.key = this.formatKeyToConfiguredFormat(config.key, this.format);
    this.filePath = config.filePath;
    const { replacementTemplate, targetPath } = this.getParametersFromFilePath(this.filePath, config.parameters);
    this.replacementTemplate = replacementTemplate;
    this.targetPath = targetPath;
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

    this.updateFile(updatedJSON, this.targetPath);
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

  private getParametersFromFilePath(filePath: string, parameters: { [key: string]: any }): { replacementTemplate: string, targetPath: string } {
    const result = {
      replacementTemplate: '',
      targetPath: '',
    };

    const validApps = Object.values(parameters).filter((parameter) => {
      const app = parameter.app;
      const regex = new RegExp(`\\b${app}\\b`, 'g');
      const isAppVariableExists = regex.test(filePath);
      return isAppVariableExists;
    });

    if (validApps.length === 0) {
      return result;
    }

    let validProject = validApps[0];

    const needToCheckProject = validApps.length > 1;
    if (needToCheckProject) {
      const validProjects = validApps.filter((parameter) => {
        const project = parameter.project;
        const regex = new RegExp(`\\b${project}\\b`, 'g');
        const isProjectVariableExists = regex.test(filePath);
        return isProjectVariableExists;
      });

      if (validProjects.length === 0) {
        return result;
      }

      if (validProjects.length > 1) {
        throw new TooManyProjectFoldersError();
      }

      validProject = validProjects[0];
    }

    const extension = filePath.split('.').pop() || '';
    result.replacementTemplate = validProject.templates[extension];
    result.targetPath = validProject.targetPath;

    return result;
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

  private updateFile(file: TextJson, path: string): void {
    const data = JSON.stringify(file, null, 4);
    fs.writeFileSync(path, data);
    return;
  };

  private formatAndInlineText(text: string): string {
    const textWithoutMultiSpaces = text.replace(/\s\s+/g, ' ');
    const textWithoutNewLines = textWithoutMultiSpaces.replace(/\n/g, '');
    return textWithoutNewLines;
  };

  private readJSONFile(path: string): TextJson {
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

  private keyTemplateReplacement(key: JsonEditor["key"], replacement: string): string {
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