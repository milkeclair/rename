//go:build windows

package app_test

import (
	a "github.com/milkeclair/rename/backend/app"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"log"
	"reflect"
	"testing"
)

func TestNativeHost(t *testing.T) {
	host := a.NativeHost()
	for _, pair := range [][2]interface{}{{host.Run, wails.Run}, {host.OpenDirectoryDialog, runtime.OpenDirectoryDialog}, {host.EventsEmit, runtime.EventsEmit}, {host.Fatal, log.Fatal}} {
		if reflect.ValueOf(pair[0]).Pointer() != reflect.ValueOf(pair[1]).Pointer() {
			t.Fatal("native function connected incorrectly")
		}
	}
}
