package fileops

import (
	"fmt"
	"os"
	"path/filepath"
)

type File struct {
	Path      string
	Name      string
	Directory string
	CreatedAt int64
}

func InputFiles(path string) ([]string, error) {
	info, err := os.Lstat(path)
	if err != nil {
		return nil, fmt.Errorf("読み取れません: %s: %w", path, err)
	}

	if !info.IsDir() {
		return []string{path}, nil
	}

	children, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	files := []string{}

	for _, child := range children {
		if !child.IsDir() && child.Type()&os.ModeSymlink == 0 {
			files = append(files, filepath.Join(path, child.Name()))
		}
	}

	return files, nil
}

func InspectFile(path string) (File, error) {
	absolute, err := filepath.Abs(path)
	if err != nil {
		return File{}, err
	}

	info, err := os.Lstat(absolute)
	if err != nil {
		return File{}, fmt.Errorf("読み取れません: %s: %w", path, err)
	}
	if !info.Mode().IsRegular() {
		return File{}, fmt.Errorf("通常のファイルではありません: %s", path)
	}

	return File{
		Path:      absolute,
		Name:      info.Name(),
		Directory: filepath.Dir(absolute),
		CreatedAt: CreationTime(info).UnixMilli(),
	}, nil
}
