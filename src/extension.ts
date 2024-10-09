//@ts-nocheck

import * as vscode from "vscode";
import getHype from "./getHype.js";

let currentBreed = "golden";

export function activate(context: vscode.ExtensionContext) {
  const provider = new HypedawgViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      HypedawgViewProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("hypedawg.hype", () => {
      provider.hype();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("hypedawg.breed", () => {
      provider.changeBreed();
    })
  );
}

class HypedawgViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "hypedawg.hypedawgView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "colorSelected": {
          vscode.window.activeTextEditor?.insertSnippet(
            new vscode.SnippetString(`#${data.value}`)
          );
          break;
        }
      }
    });
  }

  public async hype() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ animation: "read" });
      const { text, animation } = await getHype(
        currentBreed,
        vscode.window.activeTextEditor.document.languageId,
        vscode.window.activeTextEditor.document.getText()
      );
      vscode.window.showInformationMessage(text);
      this._view.webview.postMessage({ animation });
    }
  }

  public async changeBreed() {
    if (this._view) {
      const input = await vscode.window.showQuickPick([
        "wolf",
        "pomeranian",
        "golden",
        "shiba",
      ]);
      currentBreed = input;
      this._view.webview.postMessage({ breed: input, animation: "idle" });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    const spriteUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "sprite.css")
    );
    const goldenUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "golden.png")
    );
    const wolfUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "wolf.png")
    );
    const shibaUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "shiba.png")
    );
    const pomeranianUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "pomeranian.png")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval'; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				<link href="${spriteUri}" rel="stylesheet">

        <style>
          .golden {
            background-image: url(${goldenUri});
          }
          .shiba {
            background-image: url(${shibaUri});
          }
          .wolf {
            background-image: url(${wolfUri});
          }
          .pomeranian {
            background-image: url(${pomeranianUri});
          }
        </style>

				<title>Hypedawg</title>
			</head>
			<body>
				<div id="hypedawg" class="idle golden"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
