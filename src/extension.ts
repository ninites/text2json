import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerTextEditorCommand('extension.copyToFolder', async (textEditor, edit) => {
		const selectedText = textEditor.document.getText(textEditor.selection);
		const keyForAutoAddedFields = vscode.workspace.getConfiguration().get('extension.keyForAutoAddedFields') as string;
		const targetedFile = vscode.workspace.getConfiguration().get('extension.targetedFile') as string;
		if (targetedFile) {
			try {
				const addedKey = await updateJSONFile(targetedFile, selectedText, keyForAutoAddedFields);
				textEditor.edit((editBuilder) => {
					editBuilder.replace(textEditor.selection, addedKey);
				});
			} catch (error: any) {
				vscode.window.showErrorMessage(`Error occured while updating JSON file. ${error.message}`);
			}
		} else {
			vscode.window.showErrorMessage('Target folder path is not configured.');
		}
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.activateCopyToFolder', () => {
			vscode.commands.executeCommand('extension.copyToFolder');
		})
	);

}

const updateJSONFile = async (filePath: string, text: string, keyForAutoAddedFields: string): Promise<string> => {
	const jsonToBeUpdated = readJSONFile(filePath);
	if (!jsonToBeUpdated[keyForAutoAddedFields]) {
		jsonToBeUpdated[keyForAutoAddedFields] = {};
	}

	const textKey = await getTextFieldKey(text);
	const textKeyToBeAdded = jsonToBeUpdated[keyForAutoAddedFields][textKey];

	if (!textKeyToBeAdded) {

		const alreadyGotValue = Object.values(jsonToBeUpdated[keyForAutoAddedFields]).find((value) => value === text);
		if (!alreadyGotValue) {
			jsonToBeUpdated[keyForAutoAddedFields][textKey] = formatAndInlineText(text);
		} else {
			const alreadyExistingKey = Object.keys(jsonToBeUpdated[keyForAutoAddedFields]).find((key) => jsonToBeUpdated[keyForAutoAddedFields][key] === text);
			throw new Error(`Value already exists KEY = ${alreadyExistingKey}`);
		}

	} else {
		throw new Error('Key already exists');
	}

	updateFile(filePath, jsonToBeUpdated);
	return textKey;
};

const formatAndInlineText = (text: string): string => {
	const textWithoutMultiSpaces = text.replace(/\s\s+/g, ' ');
	const textWithoutNewLines = textWithoutMultiSpaces.replace(/\n/g, '');
	return textWithoutNewLines;
};


const getTextFieldKey = (text: string): string => {
	const randomNumberIdToString = Math.random().toString(36).substring(7);
	return randomNumberIdToString;
};

const updateFile = (filePath: string, file: { [key: string]: string }) => {
	const data = JSON.stringify(file, null, 4);
	fs.writeFileSync(filePath, data);
	return;
};

const readJSONFile = (filePath: string) => {
	try {
		const data = fs.readFileSync(filePath, 'utf8');
		const file = JSON.parse(data);
		return file;
	} catch (err) {
		console.error(err);
	}
};

vscode.workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration('extension.targetFolderPath')) {
		// Perform any necessary actions when the configuration is updated
	}
});

// This method is called when your extension is deactivated
export function deactivate() { }
