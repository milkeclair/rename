package renamer

import "github.com/milkeclair/rename/backend/internal/fileops"

type FileMove struct {
	plan        Item
	currentPath string
	status      Status
	issue       string
}

func NewFileMove(plan Item) FileMove {
	return FileMove{plan: plan, currentPath: plan.Source, status: StatusPending, issue: plan.Issue}
}

func (file *FileMove) Stage(staging *fileops.StagingArea) error {
	if file.plan.Source == file.plan.Destination {
		file.status = StatusUnchanged
		return nil
	}

	staged, err := staging.Place(file.plan.Source)

	if err == nil {
		file.currentPath = staged
	} else {
		file.status = StatusFailed
		file.issue = err.Error()
	}

	return err
}

func (file *FileMove) Commit() error {
	if file.status == StatusUnchanged {
		return nil
	}

	outcome, err := fileops.Move(file.currentPath, file.plan.Destination)

	if err == nil {
		file.currentPath = file.plan.Destination
		file.status = StatusDone
	} else {
		file.issue = err.Error()
		if outcome.DestinationCreated {
			file.status = StatusPartial
		} else {
			file.status = StatusFailed
		}
	}

	return err
}

func (file *FileMove) Restore() {
	if file.status.Completed() || file.currentPath == file.plan.Source {
		return
	}

	err := fileops.RenameNoReplace(file.currentPath, file.plan.Source)

	if err == nil {
		file.currentPath = file.plan.Source
	} else {
		file.issue += " 元の場所へ戻せません: " + err.Error()

		if file.status != StatusPartial {
			file.status = StatusFailed
		}
	}
}

func (file FileMove) Result() ResultItem {
	return ResultItem{
		Source:      file.plan.Source,
		Destination: file.plan.Destination,
		CurrentPath: file.currentPath,
		Status:      file.status,
		Issue:       file.issue,
	}
}
