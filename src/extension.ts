import * as vscode from 'vscode';
import { JsonEditor, JsonEditorConfig } from './JsonEditor';
import { LocalErrors, ValueAlreadyExistsError } from './Errors';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerTextEditorCommand('extension.copyToFolder', async (textEditor, edit) => {
		const key = await vscode.window.showInputBox({
			prompt: 'Enter your key label for the new text value (dot notation) '
		});

		if (key) {
			const { text, targetPath, replacementTemplate, keyCase } = getConfig(textEditor);
			if (targetPath) {

				const config: JsonEditorConfig = {
					targetPath,
					text,
					replacementTemplate,
					key,
					keyCase,
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
	const text = textEditor.document.getText(textEditor.selection);
	const targetPath = vscode.workspace.getConfiguration().get('extension.targetPath') as string;
	const replacementTemplate = vscode.workspace.getConfiguration().get('extension.replacementTemplate') as string;
	const keyCase = vscode.workspace.getConfiguration().get('extension.keyCase') as 'uppercase' | 'camelcase';
	return {
		text,
		targetPath,
		replacementTemplate,
		keyCase,
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
		// Perform any necessary actions when the configuration is updated
	}
});

export function deactivate() { }
