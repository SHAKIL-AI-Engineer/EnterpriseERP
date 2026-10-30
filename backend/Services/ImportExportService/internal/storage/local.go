package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

type LocalStorage struct {
	Root string
}

func (s LocalStorage) Save(subdir, original string, r io.Reader) (relPath string, hash string, size int64, err error) {
	dir := filepath.Join(s.Root, subdir)
	if err = os.MkdirAll(dir, 0o750); err != nil {
		return "", "", 0, err
	}
	name := fmt.Sprintf("%s_%s", uuid.NewString(), sanitize(original))
	full := filepath.Join(dir, name)
	f, err := os.Create(full)
	if err != nil {
		return "", "", 0, err
	}
	defer f.Close()
	h := sha256.New()
	mw := io.MultiWriter(f, h)
	size, err = io.Copy(mw, r)
	if err != nil {
		_ = os.Remove(full)
		return "", "", 0, err
	}
	hash = hex.EncodeToString(h.Sum(nil))
	relPath, _ = filepath.Rel(s.Root, full)
	return relPath, hash, size, nil
}

func sanitize(name string) string {
	base := filepath.Base(name)
	base = strings.ReplaceAll(base, "..", "")
	if base == "" || base == "." {
		base = "upload.bin"
	}
	return base
}

func ValidateMIME(path string, allowed []string) error {
	ext := strings.ToLower(filepath.Ext(path))
	mt := mime.TypeByExtension(ext)
	for _, a := range allowed {
		if strings.EqualFold(mt, a) || strings.HasPrefix(mt, strings.TrimSuffix(a, "/*")) {
			return nil
		}
	}
	// allow common excel extensions
	switch ext {
	case ".xlsx", ".xlsm", ".csv":
		return nil
	default:
		return fmt.Errorf("disallowed file type: %s", ext)
	}
}
