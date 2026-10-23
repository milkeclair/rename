package renamer_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	"strings"
	"testing"
)

func TestValidateNumberRange(t *testing.T) {
	for _, c := range []struct {
		start int64
		count int
		valid bool
	}{{0, 1, true}, {999999999999, 1, true}, {999999999998, 2, true}, {999999999999, 2, false}, {1000000000000, 0, false}, {-1, 1, false}} {
		if err := r.ValidateNumberRange(c.start, c.count); (err == nil) != c.valid {
			t.Errorf("%+v: %v", c, err)
		}
	}
}
func TestParsePattern(t *testing.T) {
	for _, pattern := range []string{"", "abc", "{番号}{番号}", "{番号:00x}", "{番号:0000000000000}"} {
		if _, err := r.ParsePattern(pattern); err == nil {
			t.Errorf("accepted %q", pattern)
		}
	}
	for _, pattern := range []string{"{番号}", "pre{番号:0000}post"} {
		if _, err := r.ParsePattern(pattern); err != nil {
			t.Error(err)
		}
	}
}
func TestNamePatternFormat(t *testing.T) {
	for _, c := range []struct {
		pattern   string
		number    int64
		ext, want string
	}{{"{番号:0000}", 1, ".jpg", "0001.jpg"}, {"p{番号}q", 0, ".TXT", "p0q.TXT"}, {"{番号:00}", 123, "", "123"}} {
		pattern, err := r.ParsePattern(c.pattern)
		if err != nil {
			t.Fatal(err)
		}
		got, err := pattern.Format(c.number, c.ext)
		if err != nil || got != c.want {
			t.Fatalf("%q %v", got, err)
		}
	}
	pattern, _ := r.ParsePattern("CON.{番号}")
	if _, err := pattern.Format(1, ""); err == nil {
		t.Fatal("reserved name accepted")
	}
}
func TestValidateFilename(t *testing.T) {
	for _, name := range []string{"CON", "con.txt", "LPT1.txt", "x/1", "a.", "a ", "x\x01", "{other}", strings.Repeat("あ", 256), strings.Repeat("😀", 128)} {
		if err := r.ValidateFilename(name); err == nil {
			t.Errorf("accepted %q", name)
		}
	}
	for _, name := range []string{"0001.txt", "CONSOLE.txt", strings.Repeat("あ", 255)} {
		if err := r.ValidateFilename(name); err != nil {
			t.Errorf("%q: %v", name, err)
		}
	}
}
