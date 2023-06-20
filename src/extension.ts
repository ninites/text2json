import * as vscode from 'vscode';
import { JsonEditor, JsonEditorConfig } from './JsonEditor';
import { LocalErrors, ValueAlreadyExistsError } from './Errors';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerTextEditorCommand('extension.copyToFolder', async (textEditor, edit) => {
		const key = await vscode.window.showInputBox({
			prompt: 'Enter your key label for the new text value (dot notation) '
		});

		if (key) {
			const { text, keyCase, filePath, parameters } = getConfig(textEditor);
			if (parameters) {

				const config: JsonEditorConfig = {
					text,
					key,
					keyCase,
					filePath,
					parameters
				};

				const jsonEditor = new JsonEditor(config);

				try {
					const replacement = jsonEditor.updateJSONFile();
					textEditor.edit((editBuilder) => {
						editBuilder.replace(textEditor.selection, replacement);
					});
				} catch (error: any) {
					handleErrors(error, jsonEditor);
				}

			} else {
				vscode.window.showErrorMessage('Target folder path is not configured.');
			}
		}
	});

	context.subscriptions.push(disposable);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.activateCopyToFolder', () => {
			vscode.commands.executeCommand('extension.copyToFolder');
		})
	);

}

const getConfig = (textEditor: any) => {
	const config = vscode.workspace.getConfiguration();
	const text = textEditor.document.getText(textEditor.selection);
	const keyCase = config.get('extension.keyCase') as 'uppercase' | 'camelcase';
	const parameters = config.get('extension.parameters') as { [key: string]: any };
	const filePath = textEditor.document.uri.fsPath;

	return {
		text,
		keyCase,
		filePath,
		parameters
	};
};

const handleErrors = async (error: any, jsonEditor: JsonEditor) => {
	const notLocalError = !(error instanceof LocalErrors);
	if (notLocalError) {
		vscode.window.showErrorMessage(`Error occurred while updating JSON file. ${error.message}`);
		return;
	}

	if (error instanceof ValueAlreadyExistsError) {
		await vscode.window.showErrorMessage(error.message);
		const copyPastePart = jsonEditor.getReplacementTemplate();
		await vscode.env.clipboard.writeText(copyPastePart);
		vscode.window.showInformationMessage(`Copied to clipboard: ${copyPastePart}`);
		return;
	}

	vscode.window.showErrorMessage(error.message);
	return;
};

vscode.workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration('extension.targetFolderPath')) {
	}
});

export function deactivate() { }
