package renamer

import (
	"path/filepath"

	"github.com/milkeclair/rename/backend/internal/fileops"
)

type Batch struct {
	files   []FileMove
	issue   string
	staging fileops.StagingArea
	report  func(Progress)
}

func Execute(request Request, report func(Progress)) Result {
	operation := NewBatch(Preview(request), report)

	if operation.issue == "" && len(operation.files) > 0 {
		operation.Run()
	}

	return operation.Result()
}

func NewBatch(plan Plan, report func(Progress)) Batch {
	operation := Batch{
		files:   make([]FileMove, 0, len(plan.Items)),
		issue:   plan.Issue,
		staging: fileops.NewStagingArea(),
		report:  report,
	}

	for _, item := range plan.Items {
		operation.files = append(operation.files, NewFileMove(item))

		if item.Issue != "" {
			operation.issue = "入力または出力先を確認してください"
		}
	}

	return operation
}

func (operation *Batch) Run() {
	defer operation.RemoveStagingDirectories()

	if operation.StageAll() {
		operation.MoveAll()
	}

	if operation.issue != "" {
		operation.RestorePending()
	}
}

func (operation *Batch) StageAll() bool {
	for index := range operation.files {
		file := &operation.files[index]

		if err := file.Stage(&operation.staging); err != nil {
			operation.issue = "変更を開始できませんでした"
			return false
		}
	}

	return true
}

func (operation *Batch) MoveAll() {
	for index := range operation.files {
		file := &operation.files[index]

		if err := file.Commit(); err != nil {
			operation.issue = "途中で停止しました。各ファイルの結果を確認してください"
			return
		}

		if operation.report != nil {
			operation.report(Progress{
				Completed: index + 1,
				Total:     len(operation.files),
				Name:      filepath.Base(file.plan.Destination),
			})
		}
	}
}

func (operation *Batch) RestorePending() {
	for index := range operation.files {
		operation.files[index].Restore()
	}
}

func (operation *Batch) RemoveStagingDirectories() {
	operation.issue += operation.staging.Cleanup()
}

func (operation *Batch) Result() Result {
	result := Result{Items: make([]ResultItem, 0, len(operation.files)), Issue: operation.issue}

	for _, file := range operation.files {
		result.Items = append(result.Items, file.Result())
	}

	return result
}
