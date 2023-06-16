import * as fs from 'fs';

type JsonEditorConfig = {
  targetPath: string;
  text: string;
  nestedKeyLabel: string;
};

type TextJson = { [key: string]: any };

class JsonEditor {
  private readonly targetPath: string;
  private readonly text: string;
  private readonly nestedKeyLabel: string;
  constructor(config: JsonEditorConfig = {
    targetPath: '',
    text: '',
    nestedKeyLabel: '',
  }) {
    this.targetPath = config.targetPath;
    this.text = config.text;
    this.nestedKeyLabel = config.nestedKeyLabel;
  }

  public updateJSONFile(): string {
    const jsonToBeUpdated = this.getJSONToBeUpdated();
    const textKey = this.getTextFieldKey();
    const textFieldKeyAlreadyExists = this.checkIfTextFieldKeyAlreadyExists(jsonToBeUpdated, textKey);
    if (textFieldKeyAlreadyExists) {
      throw new Error('Key already exists');
    }

    const valueAlreadyExists = this.checkIfValueAlreadyExists(jsonToBeUpdated);
    if (valueAlreadyExists) {
      throw new Error('Value already exists');
    }
    const jsonWithNewValue = this.addTextToJSON(jsonToBeUpdated, textKey);
    this.updateFile(jsonWithNewValue);
    return textKey;
  };

  public getJSONToBeUpdated(): TextJson {
    let jsonToBeUpdated = this.readJSONFile();
    if (!jsonToBeUpdated[this.nestedKeyLabel]) {
      jsonToBeUpdated[this.nestedKeyLabel] = {};
    }
    return jsonToBeUpdated;
  }

  public getTextFieldKey(): string {
    const randomNumberIdToString = Math.random().toString(36).substring(7);
    return randomNumberIdToString;
  };

  public checkIfTextFieldKeyAlreadyExists(file: TextJson, key: string): boolean {
    return file[this.nestedKeyLabel][key] ? true : false;
  }

  public checkIfValueAlreadyExists(file: TextJson): boolean {
    const values = Object.values(file[this.nestedKeyLabel]);
    return values.includes(this.text);
  }

  public addTextToJSON(file: TextJson, key: string): TextJson {
    file[this.nestedKeyLabel][key] = this.formatAndInlineText(this.text);
    return file;
  }

  public updateFile(file: TextJson): void {
    const data = JSON.stringify(file, null, 4);
    fs.writeFileSync(this.targetPath, data);
    return;
  };

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

}

export { JsonEditor, JsonEditorConfig };