import * as fs from 'fs';
import { Utils } from './Utils';

type JsonEditorConfig = {
  targetPath: string;
  text: string;
  nestedKeyLabel: string;
  newValueKeyLabel: string;
  replacementTemplate: string;
  newValueKeyFormat: 'uppercase' | 'camelcase';
  jsonType: 'nested' | 'flat';
};

type TextJson = { [key: string]: any };

class JsonEditor {

  private readonly targetPath: string;
  private readonly text: string;
  private readonly nestedKeyLabel: string;
  private readonly newValueKeyLabel: string;
  private readonly utils: Utils;
  private readonly replacementTemplate: string;
  private readonly newValueKeyFormat: 'uppercase' | 'camelcase';
  private readonly jsonType: 'nested' | 'flat';

  constructor(config: JsonEditorConfig = {
    targetPath: '',
    text: '',
    nestedKeyLabel: '',
    newValueKeyLabel: '',
    replacementTemplate: '',
    newValueKeyFormat: 'camelcase',
    jsonType: 'nested'
  }, utils: Utils = new Utils()
  ) {
    this.utils = utils;
    this.text = config.text;
    this.targetPath = config.targetPath;
    this.nestedKeyLabel = config.nestedKeyLabel;
    this.newValueKeyFormat = config.newValueKeyFormat;
    this.newValueKeyLabel = this.formatKeyToConfiguredFormat(config.newValueKeyLabel);
    this.replacementTemplate = config.replacementTemplate;
    this.jsonType = config.jsonType;
  }

  public updateJSONFile(): string {
    const jsonToBeUpdated = this.getJSONToBeUpdated();
    switch (this.jsonType) {
      case "nested":
        return this.handleNestedJSON(jsonToBeUpdated);
      case "flat":
        return this.handleFlatJSON(jsonToBeUpdated);
    }
  };

  public getJSONToBeUpdated(): TextJson {
    let jsonToBeUpdated = this.readJSONFile();
    if (!jsonToBeUpdated[this.nestedKeyLabel]) {
      jsonToBeUpdated[this.nestedKeyLabel] = {};
    }
    return jsonToBeUpdated;
  }

  public addTextToJSON(file: TextJson): TextJson {
    switch (this.jsonType) {
      case "nested":
        file[this.nestedKeyLabel][this.newValueKeyLabel] = this.formatAndInlineText(this.text);
        return file;
      case "flat":
        file[this.newValueKeyLabel] = this.formatAndInlineText(this.text);
        return file;
    }
  }

  public updateFile(file: TextJson): void {
    const data = JSON.stringify(file, null, 4);
    fs.writeFileSync(this.targetPath, data);
    return;
  };

  private handleNestedJSON(jsonToBeUpdated: TextJson): string {
    const textFieldKeyAlreadyExists = jsonToBeUpdated[this.nestedKeyLabel][this.newValueKeyLabel] ? true : false;
    if (textFieldKeyAlreadyExists) {
      throw new Error('Key already exists');
    }

    const valueAlreadyExists = Object.values(jsonToBeUpdated[this.nestedKeyLabel]).includes(this.text);
    if (valueAlreadyExists) {
      const alreadyExistingKey = this.getKeyFromValueForNestedType(jsonToBeUpdated);
      throw new Error(`Value already exists KEY: ${alreadyExistingKey}`);
    }
    const jsonWithNewValue = this.addTextToJSON(jsonToBeUpdated);
    this.updateFile(jsonWithNewValue);
    return this.keyTemplateReplacement(this.newValueKeyLabel);
  }

  private handleFlatJSON(jsonToBeUpdated: TextJson): string {
    const keyAlreadyExists = Object.keys(jsonToBeUpdated).includes(this.newValueKeyLabel);
    if (keyAlreadyExists) {
      throw new Error('Key already exists');
    }

    const valueAlreadyExists = Object.values(jsonToBeUpdated).includes(this.text);
    if (valueAlreadyExists) {
      const alreadyExistingKey = Object.keys(jsonToBeUpdated)[Object.values(jsonToBeUpdated).indexOf(this.text)];
      throw new Error(`Value already exists KEY: ${alreadyExistingKey}`);
    }
    const jsonWithNewValue = this.addTextToJSON(jsonToBeUpdated);
    this.updateFile(jsonWithNewValue);
    return this.keyTemplateReplacement(this.newValueKeyLabel);
  }

  private getKeyFromValueForNestedType(file: TextJson): string {
    const values = Object.values(file[this.nestedKeyLabel]);
    const key = Object.keys(file[this.nestedKeyLabel])[values.indexOf(this.text)];
    return key;
  }

  private formatAndInlineText(text: string): string {
    const textWithoutMultiSpaces = text.replace(/\s\s+/g, ' ');
    const textWithoutNewLines = textWithoutMultiSpaces.replace(/\n/g, '');
    return textWithoutNewLines;
  };

  private readJSONFile(): TextJson {
    const data = fs.readFileSync(this.targetPath, 'utf8');
    if (!data) {
      throw new Error('File is empty');
    }
    const file = JSON.parse(data);
    return file;
  };

  private formatKeyToConfiguredFormat(value: string): string {
    switch (this.newValueKeyFormat) {
      case "camelcase":
        return this.utils.toCamelCase(value);
      case "uppercase":
        return value.toUpperCase();
    }
  }

  private keyTemplateReplacement(key: string): string {
    if (!this.replacementTemplate) {
      return key;
    }

    const template = this.replacementTemplate;
    const updatedKey = template.replace(/\$VAR\$/g, key);
    return updatedKey;
  }

}

export { JsonEditor, JsonEditorConfig };