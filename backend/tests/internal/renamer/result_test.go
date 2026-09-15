package renamer_test

import (
	r "github.com/milkeclair/rename/backend/internal/renamer"
	"testing"
)

func TestStatusCompleted(t *testing.T) {
	for _, c := range []struct {
		status r.Status
		want   bool
	}{{r.StatusDone, true}, {r.StatusUnchanged, true}, {r.StatusPending, false}, {r.StatusFailed, false}, {r.StatusPartial, false}, {"unknown", false}} {
		if c.status.Completed() != c.want {
			t.Errorf("%s", c.status)
		}
	}
}
