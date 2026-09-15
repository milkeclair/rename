package fileops

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type MoveOutcome struct {
	DestinationCreated bool
}

func Move(source, destination string) (MoveOutcome, error) {
	err := RenameNoReplace(source, destination)

	switch {
	case err == nil:
		return MoveOutcome{DestinationCreated: true}, nil
	case IsCrossDevice(err):
		return CopyAndRemove(source, destination)
	default:
		return MoveOutcome{}, err
	}
}

func CopyAndRemove(source, destination string) (MoveOutcome, error) {
	input, err := OpenForCopy(source)
	if err != nil {
		return MoveOutcome{}, err
	}
	defer input.Close()

	output, err := os.CreateTemp(filepath.Dir(destination), ".rename-writing-")
	if err != nil {
		return MoveOutcome{}, err
	}

	temporary := output.Name()
	defer os.Remove(temporary)
	defer output.Close()

	if err := PrepareCopy(input, output); err != nil {
		return MoveOutcome{}, err
	}

	if err := output.Close(); err != nil {
		return MoveOutcome{}, err
	}
	if err := input.Close(); err != nil {
		return MoveOutcome{}, err
	}

	if err := RenameNoReplace(temporary, destination); err != nil {
		return MoveOutcome{}, err
	}

	outcome := MoveOutcome{DestinationCreated: true}
	if err := os.Remove(source); err != nil {
		return outcome, fmt.Errorf("出力先への書き込みは完了しましたが元ファイルを削除できません: %w", err)
	}

	return outcome, nil
}

func PrepareCopy(input, output *os.File) error {
	before, err := input.Stat()
	if err != nil {
		return err
	}

	if err := CopyVerified(input, output, before.Size()); err != nil {
		return err
	}
	if err := VerifySource(input.Name(), before); err != nil {
		return err
	}

	return PreserveTimes(output, before)
}

var errVerification = errors.New("内容の検証に失敗したため元ファイルを保持しました")

func CopyVerified(input, output *os.File, size int64) error {
	originalHash := sha256.New()
	written, err := io.Copy(io.MultiWriter(output, originalHash), input)
	if err != nil {
		return err
	}

	if err := output.Sync(); err != nil {
		return err
	}
	if _, err := output.Seek(0, io.SeekStart); err != nil {
		return err
	}

	writtenHash := sha256.New()
	if _, err := io.Copy(writtenHash, output); err != nil {
		return err
	}

	contentMatches := bytes.Equal(originalHash.Sum(nil), writtenHash.Sum(nil))

	if written != size || !contentMatches {
		return errVerification
	}

	return nil
}

func VerifySource(source string, before os.FileInfo) error {
	after, err := os.Stat(source)
	if err != nil {
		return err
	}

	sameFile := os.SameFile(before, after)
	unchanged := before.Size() == after.Size() && before.ModTime().Equal(after.ModTime())

	if !sameFile || !unchanged {
		return errVerification
	}

	return nil
}
