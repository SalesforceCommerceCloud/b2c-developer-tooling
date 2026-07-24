//go:build mage
// +build mage

package main

import (
	"github.com/magefile/mage/sh"
)

// Build builds the plugin for the current platform.
func Build() error {
	return sh.RunV("go", "build", "-o", "dist/gpx_b2c_metrics", "./pkg")
}

// BuildAll builds the plugin for all supported platforms.
func BuildAll() error {
	platforms := []struct {
		os   string
		arch string
	}{
		{"linux", "amd64"},
		{"linux", "arm64"},
		{"darwin", "amd64"},
		{"darwin", "arm64"},
		{"windows", "amd64"},
	}

	// Build both metrics and CIP datasources
	packages := []struct {
		path   string
		binary string
	}{
		{"./pkg", "gpx_b2c_metrics"},
		{"./pkg/cip", "gpx_b2c_cip"},
	}

	for _, pkg := range packages {
		for _, p := range platforms {
			output := "dist/" + pkg.binary + "_" + p.os + "_" + p.arch
			if p.os == "windows" {
				output += ".exe"
			}

			if err := sh.RunWithV(map[string]string{
				"GOOS":   p.os,
				"GOARCH": p.arch,
			}, "go", "build", "-o", output, pkg.path); err != nil {
				return err
			}
		}
	}
	return nil
}

// Clean removes build artifacts.
func Clean() error {
	return sh.Rm("dist")
}

// Test runs the test suite.
func Test() error {
	return sh.RunV("go", "test", "-v", "./...")
}
