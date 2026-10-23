package fileops

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
)

func Key(path string) string {
	return strings.ToLower(filepath.Clean(path))
}

func OutputDirectory(path string) (string, error) {
	if path == "" {
		return "", errors.New("出力先フォルダを選択してください")
	}

	absolute, err := filepath.Abs(path)
	if err != nil {
		return "", err
	}

	info, err := os.Stat(absolute)
	if err != nil || !info.IsDir() {
		return absolute, errors.New("出力先フォルダを読み取れません")
	}

	return absolute, nil
}

func SourcePath(path string) (string, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return absolute, err
	}

	info, err := os.Lstat(absolute)
	if err != nil || !info.Mode().IsRegular() {
		return absolute, errors.New("元ファイルを読み取れません")
	}

	return absolute, nil
}

type Destination struct {
	Exists bool
	Err    error
}

func ReadDestination(path string) Destination {
	_, err := os.Lstat(path)
	if os.IsNotExist(err) {
		return Destination{}
	}

	return Destination{Exists: err == nil, Err: err}
}
