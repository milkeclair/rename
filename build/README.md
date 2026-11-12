# Windowsビルド

配布対象はWindows x64（Intel・AMDの64ビット）。Windows上でGo 1.27.1以降、Node.js 26.8.2以降、go.modと同じバージョンのWails CLIを使用する。
LLVMのリソースツールを含むbinディレクトリもPATHに追加する。

- `llvm-rc.exe`: リソーススクリプトをRES形式にコンパイルする。
- `llvm-cvtres.exe`: RES形式をGoがリンクできるCOFF形式に変換する。

LLVM公式配布または [LLVM-MinGW](https://github.com/mstorsjo/llvm-mingw/releases) から取得できる。LLVM-MinGW 20260908のx86_64/UCRT配布で検証済み。
これらはビルド時だけ必要で、配布先には不要。

リポジトリルートで実行する。

```powershell
$wailsVersion = go list -m -f '{{.Version}}' github.com/wailsapp/wails/v3
go install "github.com/wailsapp/wails/v3/cmd/wails3@$wailsVersion"
cd frontend
npm ci
cd ..
powershell -ExecutionPolicy Bypass -File build/windows/build.ps1
```

配布物は `build/bin/rename.exe`。実行先にはWebView2ランタイムが必要。
通常のローカルビルドはwails.jsonの値を使い、指定する場合は `build/windows/build.ps1 -Version 1.2.3` を実行する。

1. `wails3 generate bindings -ts -i` で接続コードを生成し、フロントをビルドする。
2. `resources/product` がwails.jsonの製品情報を読み込む。
3. `resources/manifest` と `resources/script` がWindowsマニフェストとリソーススクリプトを展開する。
4. `resources/generation` が `generated/rename.manifest` と `generated/rename.rc` を出力する。
5. llvm-rcでUTF-8の入力をRES形式にし、llvm-cvtresでリポジトリルートの `rename-res.syso` へ変換する。
6. `go build` で `bin/rename.exe` を作る。

独自アイコンは埋め込まず、配布にはこのスクリプトを使用する。
generated、bin、sysoは生成物としてGit管理から除外する。

Windowsリソースは標準コンパイラで生成する。wails.jsonはアプリ名と製品情報を保持し、接続コードはfrontend/bindingsへ生成する。

生成処理のユニットテストは `tests/resources` に実装との対応を保って置く。

```sh
go test ./build/tests/...
```

配布前には製品情報、マニフェストのDPI設定、PEリソースにアイコンがないことを生成EXEで確認する。

## CI

PRとmainへのpushでは変更対象を調べ、README.md、build/README.md、docs/配下、Release workflowだけの差分はWindows検証を省略する。
それ以外の変更、差分取得に失敗した場合、手動ReleaseではWindows CIがテスト・型・書式検査とビルドを実行する。
変更検出のテスト、workflowの構文検査とactions-lock検証は毎回実行する。
別ドライブ間の移動テストには、ランナーのCドライブとDドライブを使用する。
Wails CLIはGo・OS・アーキテクチャ・Wailsのバージョンごとに実行ファイルをキャッシュする。
CLI導入時のGo依存・ビルド領域をアプリ用キャッシュから分離し、CLIの依存を毎回展開する負担を減らす。

Actionの実行コミットは `.github/workflows/actions.lock` で固定する。
Actionやワークフローを追加・変更したら、リポジトリルートで `gh actions-lock` を実行し、生成差分を一緒にコミットする。
CIは `gh actions-lock --verify` で整合性と参照元を検証する。DependabotによるAction更新でも対応するlockfileが更新される。

## 手動リリース

GitHubのActions → Release → Run workflowで、branchに `main`、versionに `1.0.1` のようなバージョンを指定する。
手動実行時のmainを同じCIで検証し、成功後に `v1.0.1` タグを作成してGitHub Releaseを公開する。
CLIからも実行できる。

```sh
gh workflow run release.yml --ref main -f version=1.0.1
```

versionは `X.Y.Z` 形式で、各数値は0〜65535。先頭のvと不要な先頭ゼロは付けない。
既存タグのバージョンは開始時に拒否し、入力値をEXEの製品バージョンに使用する。

配布ファイルは `rename.exe` と `SHA256SUMS`。GitHubのimmutable releasesを有効にし、ドラフト作成・全ファイル添付・公開の順で固定する。
公開済みのタグやファイルは保持し、修正は新しいバージョンで公開する。
公開前の失敗でドラフトが残った場合は、内容を確認してドラフトを削除してから、Actionsの「Re-run failed jobs」で公開ジョブを再実行する。
その実行が作成したタグは同じコミットを指すことを確認して再利用する。
