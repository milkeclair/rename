package app

import (
	"fmt"
	"sync"

	"github.com/milkeclair/rename/backend/internal/renamer"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type App struct {
	mu   sync.Mutex
	host Host
}

func NewApp(host Host) *App {
	return &App{host: host}
}

func (a *App) beforeClose() bool {
	canClose := a.mu.TryLock()

	if canClose {
		a.mu.Unlock()
	}

	return !canClose
}

func (a *App) Inspect(paths []string) ([]renamer.Entry, error) {
	return renamer.Inspect(paths)
}

func (a *App) ChooseParent() (string, error) {
	return a.host.OpenDirectoryDialog(application.OpenFileDialogOptions{Title: "取り込む子フォルダの親フォルダを選択", CanChooseDirectories: true})
}

func (a *App) InspectChildren(path string) ([]renamer.Entry, error) {
	return renamer.InspectChildren(path)
}

func (a *App) Preview(request renamer.Request) renamer.Plan {
	return renamer.Preview(request)
}

func (a *App) ChooseOutput() (string, error) {
	return a.host.OpenDirectoryDialog(application.OpenFileDialogOptions{Title: "出力先フォルダを選択", CanChooseDirectories: true})
}

func (a *App) Execute(request renamer.Request) (renamer.Result, error) {
	if !a.mu.TryLock() {
		return renamer.Result{}, fmt.Errorf("リネームを実行中です")
	}
	defer a.mu.Unlock()

	return renamer.Execute(request, func(progress renamer.Progress) {
		a.host.EventsEmit("rename:progress", progress)
	}), nil
}
