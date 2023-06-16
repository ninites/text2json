import * as vscode from 'vscode';
import { JsonEditor, JsonEditorConfig } from './JsonEditor';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerTextEditorCommand('extension.copyToFolder', (textEditor, edit) => {
		const selectedText = textEditor.document.getText(textEditor.selection);
		const nestedKeyLabel = vscode.workspace.getConfiguration().get('extension.nestedKeyLabel') as string;
		const targetedFile = vscode.workspace.getConfiguration().get('extension.targetedFile') as string;
		if (targetedFile) {
			try {
				const config: JsonEditorConfig = {
					targetPath: targetedFile,
					text: selectedText,
					nestedKeyLabel: nestedKeyLabel,
				};
				const jsonEditor = new JsonEditor(config);
				const addedKey = jsonEditor.updateJSONFile();
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

vscode.workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration('extension.targetFolderPath')) {
		// Perform any necessary actions when the configuration is updated
	}
});

export function deactivate() { }
