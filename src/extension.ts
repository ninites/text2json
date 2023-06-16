import * as vscode from 'vscode';
import { JsonEditor, JsonEditorConfig } from './JsonEditor';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerTextEditorCommand('extension.copyToFolder', async (textEditor, edit) => {
		const newValueKeyLabel = await vscode.window.showInputBox({
			prompt: 'Enter your key label for the new value'
		});

		if (newValueKeyLabel) {
			const { selectedText, nestedKeyLabel, targetedFile, replacementTemplate, newValueKeyFormat, jsonType } = getConfig(textEditor);
			if (targetedFile) {
				try {
					const config: JsonEditorConfig = {
						targetPath: targetedFile,
						text: selectedText,
						nestedKeyLabel: nestedKeyLabel,
						newValueKeyLabel: newValueKeyLabel,
						replacementTemplate: replacementTemplate,
						newValueKeyFormat: newValueKeyFormat,
						jsonType: jsonType
					};
					const jsonEditor = new JsonEditor(config);
					const replacement = jsonEditor.updateJSONFile();
					textEditor.edit((editBuilder) => {
						editBuilder.replace(textEditor.selection, replacement);
					});
				} catch (error: any) {
					vscode.window.showErrorMessage(`Error occurred while updating JSON file. ${error.message}`);
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
	const selectedText = textEditor.document.getText(textEditor.selection);
	const nestedKeyLabel = vscode.workspace.getConfiguration().get('extension.nestedKeyLabel') as string;
	const targetedFile = vscode.workspace.getConfiguration().get('extension.targetedFile') as string;
	const replacementTemplate = vscode.workspace.getConfiguration().get('extension.replacementTemplate') as string;
	const newValueKeyFormat = vscode.workspace.getConfiguration().get('extension.valueLabelKeyType') as 'uppercase' | 'camelcase';
	const jsonType = vscode.workspace.getConfiguration().get('extension.jsonType') as 'nested' | 'flat';
	return {
		selectedText,
		nestedKeyLabel,
		targetedFile,
		replacementTemplate,
		newValueKeyFormat,
		jsonType
	};
};

vscode.workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration('extension.targetFolderPath')) {
		// Perform any necessary actions when the configuration is updated
	}
});

export function deactivate() { }
