package app

import (
	"context"
	"fmt"
	"sync"

	"github.com/milkeclair/rename/backend/internal/renamer"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx  context.Context
	mu   sync.Mutex
	host Host
}

func NewApp(host Host) *App {
	return &App{host: host}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) beforeClose(ctx context.Context) bool {
	canClose := a.mu.TryLock()

	if canClose {
		a.mu.Unlock()
	}

	return !canClose
}

func (a *App) Inspect(paths []string) ([]renamer.Entry, error) {
	return renamer.Inspect(paths)
}

func (a *App) Preview(request renamer.Request) renamer.Plan {
	return renamer.Preview(request)
}

func (a *App) ChooseOutput() (string, error) {
	return a.host.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{Title: "出力先フォルダを選択"})
}

func (a *App) Execute(request renamer.Request) (renamer.Result, error) {
	if !a.mu.TryLock() {
		return renamer.Result{}, fmt.Errorf("リネームを実行中です")
	}
	defer a.mu.Unlock()

	return renamer.Execute(request, func(progress renamer.Progress) {
		a.host.EventsEmit(a.ctx, "rename:progress", progress)
	}), nil
}
