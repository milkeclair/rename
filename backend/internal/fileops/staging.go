package fileops

import (
	"os"
	"path/filepath"
)

type StagingArea struct {
	directories map[string]string
}

func NewStagingArea() StagingArea {
	return StagingArea{directories: map[string]string{}}
}

func (staging *StagingArea) Place(source string) (string, error) {
	parent := filepath.Dir(source)
	directory, exists := staging.directories[parent]

	if !exists {
		var err error

		directory, err = os.MkdirTemp(parent, ".rename-")
		if err != nil {
			return "", err
		}

		staging.directories[parent] = directory
	}

	destination := filepath.Join(directory, filepath.Base(source))
	if err := RenameNoReplace(source, destination); err != nil {
		return "", err
	}

	return destination, nil
}

func (staging *StagingArea) Cleanup() string {
	issue := ""

	for _, directory := range staging.directories {
		err := os.Remove(directory)

		if err != nil && !os.IsNotExist(err) {
			issue += " 一時フォルダを確認してください: " + directory
		}
	}

	return issue
}
