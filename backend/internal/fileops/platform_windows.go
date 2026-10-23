package fileops

import (
	"errors"
	"os"
	"syscall"
	"time"

	"golang.org/x/sys/windows"
)

func CreationTime(info os.FileInfo) time.Time {
	data := info.Sys().(*syscall.Win32FileAttributeData)

	return time.Unix(0, data.CreationTime.Nanoseconds())
}

func RenameNoReplace(source, destination string) error {
	from, err := windows.UTF16PtrFromString(source)
	if err != nil {
		return err
	}

	to, err := windows.UTF16PtrFromString(destination)
	if err != nil {
		return err
	}

	return windows.MoveFileEx(from, to, windows.MOVEFILE_WRITE_THROUGH)
}

func IsCrossDevice(err error) bool {
	return errors.Is(err, windows.ERROR_NOT_SAME_DEVICE)
}

func OpenForCopy(path string) (*os.File, error) {
	name, err := windows.UTF16PtrFromString(path)
	if err != nil {
		return nil, err
	}

	handle, err := windows.CreateFile(
		name,
		windows.GENERIC_READ,
		windows.FILE_SHARE_READ,
		nil,
		windows.OPEN_EXISTING,
		windows.FILE_FLAG_SEQUENTIAL_SCAN,
		0,
	)
	if err != nil {
		return nil, err
	}

	return os.NewFile(uintptr(handle), path), nil
}

func PreserveTimes(file *os.File, info os.FileInfo) error {
	data := info.Sys().(*syscall.Win32FileAttributeData)
	created := windows.Filetime{
		LowDateTime:  data.CreationTime.LowDateTime,
		HighDateTime: data.CreationTime.HighDateTime,
	}
	accessed := windows.Filetime{
		LowDateTime:  data.LastAccessTime.LowDateTime,
		HighDateTime: data.LastAccessTime.HighDateTime,
	}
	modified := windows.Filetime{
		LowDateTime:  data.LastWriteTime.LowDateTime,
		HighDateTime: data.LastWriteTime.HighDateTime,
	}

	return windows.SetFileTime(windows.Handle(file.Fd()), &created, &accessed, &modified)
}
