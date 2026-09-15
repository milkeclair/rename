# rename

Windows向けの連番リネームアプリ。Go、Wails v2、React、TypeScriptで実装。

## 使い方

1. ファイルまたはフォルダをウィンドウへドロップする。フォルダは直下のみ対象。
2. ファイル名・作成日時でソートするか、左のハンドルで順序を変更する。
3. 連番形式と開始番号を指定する。初期値は `{番号:0000}`、開始番号1。
4. 出力先は最初の対象ファイルのフォルダが初期設定される。パスの直接入力・貼り付け、またはフォルダ選択で変更し、一覧の変更後の名前を確認する。
5. 「リネーム実行」を押す。
6. 全件成功すると開始番号が今回の対象件数分進む。「クリア」で一覧と出力先を空にし、開始番号を1に戻す。連番形式と並び順は保持する。

変更不要のファイルも採番済みとして数える。途中失敗や実行エラーの場合は開始番号を進めない。

形式は `{番号}` または `{番号:0000}` を1つ含め、前後に任意の文字を付けられる。
ゼロの数が最低桁数となり、番号が桁数を超えても切り捨てない。拡張子は保持する。
異なるフォルダの同名ファイルは追加できる。同じフルパスは重複追加しない。
手動順への切り替え後は、新規追加分を末尾へ置く。
ハンドルはキーボードでも操作可能。スペースで開始、矢印で移動、スペースで確定する。

## 移動の動作

元ファイルを連番名で移動する。元を残すコピー機能ではない。
出力先が元と同じなら改名のみ。別ボリュームの場合は書き込みと内容確認が成功してから元を削除する。
別ボリュームへの移動でも作成日時・更新日時を保持する。
対象外の既存ファイルを上書きしない。

名前交換を処理するため、一時的に元フォルダ内の `.rename-*` フォルダへ移す。
別ボリュームの書き込み中は出力先に `.rename-writing-*` ファイルを使用する。
通常終了時には一時ファイル・フォルダを片付ける。
途中失敗時は処理を止め、未完了ファイルを元の場所へ戻す。戻せなかった場合は現在の場所を表示する。
既に完了したファイルは移動先に残る。移動先への書き込み後に元を削除できない場合は両方の場所を表示する。
電源断やプロセスの強制終了に対する自動復旧は行わない。実行中は通常のウィンドウ終了を抑止する。

## 開発・ビルド

Windows上でGo 1.27.1以降、Node.js 26.8.2以降、Wails CLI v2.16.0を使用する。
ビルドにはLLVMの `llvm-rc.exe` と `llvm-cvtres.exe` も必要。PATHに追加する。詳細は [build/README.md](build/README.md) を参照。
実行先にGoやNode.jsは不要。WebView2ランタイムが必要。

```sh
go install github.com/wailsapp/wails/v2/cmd/wails@v2.16.0
cd frontend
npm ci
cd ..
powershell -ExecutionPolicy Bypass -File build/windows/build.ps1
```

`build/windows/build.ps1` はWindows amd64用。独自アイコンを含めず、マニフェストと製品情報を埋め込む。通常の `wails build` はテンプレートアイコンを埋め込むため、配布時はこのスクリプトを使用する。

`build/bin/rename.exe` が配布物。画面とGoの接続コードはWailsが生成する。
ソースをWSLに置く場合、Windowsのローカル作業フォルダへコピーしてWindowsでビルド・動作確認する。
`frontend/wailsjs` は生成物としてGit管理から除外する。フロント単独で検査する前にWindowsで `wails generate module` を実行する。

## コード構成

責務と状態遷移は [docs/architecture.md](docs/architecture.md) を参照。

## テスト

Goはbackend/tests、フロントはfrontend/testsに、実装と1対1で対応するユニットテストを置く。シナリオはそれぞれのtests/scenarios配下に配置する。
対象一覧と検証内容は [docs/testing.md](docs/testing.md) を参照。

```sh
go test ./backend/tests/app ./backend/tests/internal/...
go test ./backend/tests/scenarios/...
cd frontend
npm test
npm run test:scenarios
npm run typecheck
npm run format:check
```

Goのapp接続テストとWindows固有処理はWindows上で実行する。
WSLでは `go test ./backend/tests/internal/...` でロジックとLinux実装を検証する。
Windowsで別ドライブのシナリオを実行する場合、RENAME_TEST_OTHER_DIRへテスト専用の別ドライブのフォルダを指定する。
未指定時のスキップを検証成功とは扱わない。指定先の中に作成した一時サブフォルダだけを削除する。

## 参考

- [Wails](https://wails.io/docs/introduction/)
- [Wails D&D](https://wails.io/docs/reference/runtime/draganddrop/)
- [Windowsの移動仕様](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-movefileexw)
