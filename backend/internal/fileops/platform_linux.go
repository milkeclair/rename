package fileops

import (
	"errors"
	"os"
	"time"

	"golang.org/x/sys/unix"
)

func CreationTime(info os.FileInfo) time.Time {
	return info.ModTime()
}

func RenameNoReplace(source, destination string) error {
	return unix.Renameat2(unix.AT_FDCWD, source, unix.AT_FDCWD, destination, unix.RENAME_NOREPLACE)
}

func IsCrossDevice(err error) bool {
	return errors.Is(err, unix.EXDEV)
}

func OpenForCopy(path string) (*os.File, error) {
	return os.Open(path)
}

func PreserveTimes(file *os.File, info os.FileInfo) error {
	return os.Chtimes(file.Name(), info.ModTime(), info.ModTime())
}
