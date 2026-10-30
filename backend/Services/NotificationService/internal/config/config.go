package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
)

type JwtConfig struct {
	Issuer     string `json:"Issuer"`
	Audience   string `json:"Audience"`
	SigningKey string `json:"SigningKey"`
}

type DatabaseConfig struct {
	AutoMigrate bool `json:"AutoMigrate"`
}

type Config struct {
	Port                string         `json:"Port"`
	Jwt                 JwtConfig      `json:"Jwt"`
	ConnectionStringKey string         `json:"ConnectionStringKey"`
	Database            DatabaseConfig `json:"Database"`
	ConnectionString    string         // resolved at runtime
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:                "5047",
		ConnectionStringKey: "NotificationDb",
		Jwt: JwtConfig{
			Issuer:     "AuthService",
			Audience:   "Erp.Platform",
			SigningKey: "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_32+",
		},
		Database: DatabaseConfig{AutoMigrate: false},
	}

	// Try to load appsettings.json from the module root
	_, filename, _, _ := runtime.Caller(0)
	moduleRoot := filepath.Join(filepath.Dir(filename), "..", "..")
	settingsPath := filepath.Join(moduleRoot, "appsettings.json")
	if data, err := os.ReadFile(settingsPath); err == nil {
		_ = json.Unmarshal(data, cfg)
	}

	// Override JWT signing key from env if set
	if key := os.Getenv("JWT_SIGNING_KEY"); key != "" {
		cfg.Jwt.SigningKey = key
	}
	if port := os.Getenv("NOTIFICATION_PORT"); port != "" {
		cfg.Port = port
	}
	if autoMigrate := os.Getenv("NOTIFICATION_AUTO_MIGRATE"); autoMigrate != "" {
		if parsed, err := strconv.ParseBool(autoMigrate); err == nil {
			cfg.Database.AutoMigrate = parsed
		}
	}

	// Resolve connection string from ERP_CONNECTIONSTRINGS file (shared with .NET services)
	cfg.ConnectionString = resolveConnectionString(cfg.ConnectionStringKey)
	return cfg, nil
}

func resolveConnectionString(key string) string {
	// Check direct env var first (Docker / CI)
	if cs := os.Getenv("NOTIFICATION_DB_CONNECTION"); cs != "" {
		return cs
	}

	// Use ERP_CONNECTIONSTRINGS file (same mechanism as .NET services)
	connFile := os.Getenv("ERP_CONNECTIONSTRINGS")
	if connFile == "" {
		// Default path used by start-platform.ps1
		connFile = filepath.Join("..", "..", "..", "Configuration", "connectionstrings.json")
	}

	data, err := os.ReadFile(connFile)
	if err != nil {
		return ""
	}

	var m struct {
		ConnectionStrings map[string]string `json:"ConnectionStrings"`
	}
	if err := json.Unmarshal(data, &m); err != nil {
		return ""
	}
	if cs, ok := m.ConnectionStrings[key]; ok {
		return cs
	}
	return ""
}
