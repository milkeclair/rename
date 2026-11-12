import pathlib
import subprocess
import tempfile
import unittest


SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "scripts/windows-required.sh"


class WindowsRequiredTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = pathlib.Path(self.directory.name)
        self.git("init", "-b", "main")
        self.git("config", "user.name", "CI Test")
        self.git("config", "user.email", "ci@example.invalid")
        for name in ("README.md", "backend/app.go", "docs/guide.md"):
            self.write(name, "initial\n")
        self.commit()
        self.base = self.git("rev-parse", "HEAD").strip()

    def git(self, *args):
        return subprocess.check_output(
            ["git", *args], cwd=self.root, text=True, stderr=subprocess.DEVNULL
        )

    def write(self, name, content="updated\n"):
        target = self.root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def commit(self):
        self.git("add", ".")
        self.git("commit", "--allow-empty", "-m", "fixture")

    def select(self, event="push", version="", base=None):
        return subprocess.check_output(
            ["bash", str(SCRIPT), event, self.base if base is None else base,
             self.git("rev-parse", "HEAD").strip(), version],
            cwd=self.root, text=True,
        ).strip()

    def test_documents_and_release_workflow_skip_windows(self):
        for name in ("README.md", "build/README.md", "docs/new.md",
                     ".github/workflows/release.yml"):
            with self.subTest(name=name):
                self.write(name)
                self.commit()
                self.assertEqual(self.select(), "false")
                self.assertEqual(self.select(event="pull_request"), "false")
                self.git("reset", "--hard", self.base)

    def test_application_build_dependency_and_unknown_files_require_windows(self):
        for name in ("backend/new.go", "frontend/package-lock.json", "go.mod", "go.sum",
                     "build/windows/build.ps1", ".github/workflows/ci.yml",
                     ".github/workflows/actions.lock", ".gitattributes", "unknown.txt"):
            with self.subTest(name=name):
                self.write(name)
                self.commit()
                self.assertEqual(self.select(), "true")
                self.git("reset", "--hard", self.base)

    def test_mixed_changes_require_windows(self):
        self.write("README.md")
        self.write("frontend/src/new.ts")
        self.commit()
        self.assertEqual(self.select(), "true")

    def test_deleted_application_requires_windows(self):
        self.git("rm", "backend/app.go")
        self.commit()
        self.assertEqual(self.select(), "true")

    def test_renaming_application_into_documents_requires_windows(self):
        self.git("mv", "backend/app.go", "docs/moved.md")
        self.commit()
        self.assertEqual(self.select(), "true")

    def test_renaming_documents_can_skip_windows(self):
        self.git("mv", "docs/guide.md", "docs/renamed.md")
        self.commit()
        self.assertEqual(self.select(), "false")

    def test_unusual_application_filename_requires_windows(self):
        self.write("backend/space and\nnewline.go")
        self.commit()
        self.assertEqual(self.select(), "true")

    def test_unknown_or_missing_base_requires_windows(self):
        for base in ("", "0" * 40, "f" * 40):
            with self.subTest(base=base):
                self.assertEqual(self.select(base=base), "true")

    def test_manual_release_requires_windows_without_application_changes(self):
        self.assertEqual(self.select(event="workflow_dispatch"), "true")
        self.assertEqual(self.select(event="workflow_call"), "true")
        self.assertEqual(self.select(version="1.0.1"), "true")

    def test_empty_diff_can_skip_windows(self):
        self.assertEqual(self.select(), "false")


if __name__ == "__main__":
    unittest.main()
