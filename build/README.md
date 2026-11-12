# Windowsビルド

配布対象はWindows x64（Intel・AMDの64ビット）。Windows上でGo 1.27.1以降、Node.js 26.8.2以降、go.modと同じバージョンのWails CLIを使用する。
LLVMのリソースツールを含むbinディレクトリもPATHに追加する。

- `llvm-rc.exe`: リソーススクリプトをRES形式にコンパイルする。
- `llvm-cvtres.exe`: RES形式をGoがリンクできるCOFF形式に変換する。

LLVM公式配布または [LLVM-MinGW](https://github.com/mstorsjo/llvm-mingw/releases) から取得できる。LLVM-MinGW 20260908のx86_64/UCRT配布で検証済み。
これらはビルド時だけ必要で、配布先には不要。

リポジトリルートで実行する。

```powershell
$wailsVersion = go list -m -f '{{.Version}}' github.com/wailsapp/wails/v2
go install "github.com/wailsapp/wails/v2/cmd/wails@$wailsVersion"
cd frontend
npm ci
cd ..
powershell -ExecutionPolicy Bypass -File build/windows/build.ps1
```

配布物は `build/bin/rename.exe`。実行先にはWebView2ランタイムが必要。
通常のローカルビルドはwails.jsonの値を使い、指定する場合は `build/windows/build.ps1 -Version 1.2.3` を実行する。

1. `resources/product` がwails.jsonの製品情報を読み込む。
2. `resources/manifest` と `resources/script` がWindowsマニフェストとリソーススクリプトを展開する。
3. `resources/generation` が `generated/rename.manifest` と `generated/rename.rc` を出力する。
4. llvm-rcでUTF-8の入力をRES形式へコンパイルし、llvm-cvtresでリポジトリルートの `rename-res.syso` へ変換する。
5. `wails build -nopackage` で `bin/rename.exe` を作る。

独自アイコンは埋め込まない。通常の `wails build` は標準アイコンを追加するため、配布にはこのスクリプトを使用する。
generated、bin、sysoは生成物としてGit管理から除外する。

Windowsリソースは標準コンパイラで生成し、アプリのビルドコードはwinresを使用しない。Wails自体のモジュール定義にはwinresが残るが、このアプリのGoパッケージ依存には含まれない。

生成処理のユニットテストは `tests/resources` に実装との対応を保って置く。

```sh
go test ./build/tests/...
```

配布前には製品情報、マニフェストのDPI設定、PEリソースにアイコンがないことを生成EXEで確認する。

## CI

PRとmainへのpushでWindows CIがテスト・型・書式検査とビルドを実行する。
別ドライブ間の移動テストには、ランナーのCドライブとDドライブを使用する。
