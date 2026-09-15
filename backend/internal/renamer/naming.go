package renamer

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf16"
)

const maxNumber int64 = 999999999999

var numberToken = regexp.MustCompile(`\{番号(?::(0{1,12}))?\}`)
var reservedName = regexp.MustCompile(`(?i)^(CON|PRN|AUX|NUL|COM[1-9¹²³]|LPT[1-9¹²³])(?:\.|$)`)

func ValidateNumberRange(start int64, count int) error {
	if start < 0 || start > maxNumber {
		return errors.New("開始番号は0〜999999999999の範囲で指定してください")
	}

	if int64(count) > maxNumber+1-start {
		return errors.New("開始番号は0〜999999999999の範囲で指定してください")
	}

	return nil
}

type NamePattern struct {
	prefix string
	suffix string
	width  int
}

func ParsePattern(pattern string) (NamePattern, error) {
	matches := numberToken.FindAllStringSubmatch(pattern, -1)
	if len(matches) != 1 {
		return NamePattern{}, errors.New("連番形式には {番号} または {番号:0000} を1つ指定してください")
	}

	token := matches[0]
	prefix, suffix, _ := strings.Cut(pattern, token[0])

	return NamePattern{prefix: prefix, suffix: suffix, width: len(token[1])}, nil
}

func (pattern NamePattern) Format(number int64, extension string) (string, error) {
	sequence := fmt.Sprintf("%0*d", pattern.width, number)
	name := pattern.prefix + sequence + pattern.suffix + extension

	return name, ValidateFilename(name)
}

func ValidateFilename(name string) error {
	var issue error

	switch {
	case strings.ContainsAny(name, `<>:"/\|?*{}`),
		strings.TrimRight(name, ". ") != name,
		reservedName.MatchString(name),
		len(utf16.Encode([]rune(name))) > 255:
		issue = errors.New("Windowsで使用できないファイル名です")
	case strings.ContainsFunc(name, func(character rune) bool { return character < 32 }):
		issue = errors.New("ファイル名に制御文字は使用できません")
	}

	return issue
}
