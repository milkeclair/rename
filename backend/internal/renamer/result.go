package renamer

type Status string

const (
	StatusPending   Status = "pending"
	StatusDone      Status = "done"
	StatusUnchanged Status = "unchanged"
	StatusFailed    Status = "failed"
	StatusPartial   Status = "partial"
)

func (status Status) Completed() bool {
	switch status {
	case StatusDone, StatusUnchanged:
		return true
	default:
		return false
	}
}

type ResultItem struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
	CurrentPath string `json:"currentPath"`
	Status      Status `json:"status"`
	Issue       string `json:"issue"`
}

type Result struct {
	Items []ResultItem `json:"items"`
	Issue string       `json:"issue"`
}

type Progress struct {
	Completed int    `json:"completed"`
	Total     int    `json:"total"`
	Name      string `json:"name"`
}
