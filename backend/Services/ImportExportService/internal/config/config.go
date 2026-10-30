package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type AppConfig struct {
	Server            ServerConfig            `json:"Server"`
	ConnectionStrings ConnectionStringsConfig `json:"ConnectionStrings"`
	Services          ServicesConfig          `json:"Services"`
	Redis             RedisConfig             `json:"Redis"`
	Asynq             AsynqConfig             `json:"Asynq"`
	EmployeeImport    EmployeeImportConfig    `json:"EmployeeImport"`
	Storage           StorageConfig           `json:"Storage"`
	Jwt               JwtConfig               `json:"Jwt"`
	Cors              CorsConfig              `json:"Cors"`
}

type ServicesConfig struct {
	HrBaseUrl string `json:"HrBaseUrl"`
}

type ServerConfig struct {
	Address string `json:"Address"`
}

type ConnectionStringsConfig struct {
	ImportExportDb string `json:"ImportExportDb"`
	CompanyDb      string `json:"CompanyDb"`
}

type RedisConfig struct {
	Address  string `json:"Address"`
	Password string `json:"Password"`
	DB       int    `json:"DB"`
}

type AsynqConfig struct {
	Concurrency             int `json:"Concurrency"`
	ImportLargeRowThreshold int `json:"ImportLargeRowThreshold"`
}

type EmployeeImportConfig struct {
	BatchSize       int `json:"BatchSize"`
	ParallelBatches int `json:"ParallelBatches"`
}

type StorageConfig struct {
	UploadDir    string `json:"UploadDir"`
	ExportDir    string `json:"ExportDir"`
	TemplatesDir string `json:"TemplatesDir"`
}

type JwtConfig struct {
	Issuer     string `json:"Issuer"`
	Audience   string `json:"Audience"`
	SigningKey string `json:"SigningKey"`
}

type CorsConfig struct {
	AllowedOrigins []string `json:"AllowedOrigins"`
}

func Load() (*AppConfig, error) {
	root, err := projectRoot()
	if err != nil {
		return nil, err
	}
	cfg := &AppConfig{}
	base := filepath.Join(root, "appsettings.json")
	if err := readJSON(base, cfg); err != nil {
		return nil, fmt.Errorf("read %s: %w", base, err)
	}

	env := strings.TrimSpace(os.Getenv("ASPNETCORE_ENVIRONMENT"))
	if env == "" {
		env = "Development"
	}
	overlay := filepath.Join(root, fmt.Sprintf("appsettings.%s.json", env))
	if _, err := os.Stat(overlay); err == nil {
		if err := readJSON(overlay, cfg); err != nil {
			return nil, fmt.Errorf("read %s: %w", overlay, err)
		}
	}

	central := filepath.Clean(filepath.Join(root, "..", "..", "Configuration", "connectionstrings.json"))
	if _, err := os.Stat(central); err == nil {
		var centralCfg struct {
			ConnectionStrings struct {
				ImportExportDb string `json:"ImportExportDb"`
				CompanyDb      string `json:"CompanyDb"`
			} `json:"ConnectionStrings"`
		}
		if err := readJSON(central, &centralCfg); err == nil && strings.TrimSpace(centralCfg.ConnectionStrings.ImportExportDb) != "" {
			cfg.ConnectionStrings.ImportExportDb = centralCfg.ConnectionStrings.ImportExportDb
		}
		if strings.TrimSpace(centralCfg.ConnectionStrings.CompanyDb) != "" {
			cfg.ConnectionStrings.CompanyDb = centralCfg.ConnectionStrings.CompanyDb
		}
	}

	applyEnv(cfg)
	applyDefaults(cfg)
	return cfg, nil
}

func readJSON(path string, into any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, into)
}

func applyEnv(cfg *AppConfig) {
	if v := os.Getenv("IMPORTEXPORT_SERVER_ADDRESS"); v != "" {
		cfg.Server.Address = v
	}
	if v := os.Getenv("IMPORTEXPORT_CONNECTIONSTRING"); v != "" {
		cfg.ConnectionStrings.ImportExportDb = v
	}
	if v := os.Getenv("IMPORTEXPORT_COMPANY_CONNECTIONSTRING"); v != "" {
		cfg.ConnectionStrings.CompanyDb = v
	}
	if v := os.Getenv("IMPORTEXPORT_REDIS"); v != "" {
		cfg.Redis.Address = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_SIGNINGKEY"); v != "" {
		cfg.Jwt.SigningKey = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_ISSUER"); v != "" {
		cfg.Jwt.Issuer = v
	}
	if v := os.Getenv("IMPORTEXPORT_JWT_AUDIENCE"); v != "" {
		cfg.Jwt.Audience = v
	}
	if v := os.Getenv("IMPORTEXPORT_HR_BASE_URL"); v != "" {
		cfg.Services.HrBaseUrl = v
	}
}

func applyDefaults(cfg *AppConfig) {
	if cfg.Server.Address == "" {
		cfg.Server.Address = ":8060"
	}
	if strings.TrimSpace(cfg.Services.HrBaseUrl) == "" {
		cfg.Services.HrBaseUrl = "http://127.0.0.1:5000/api/v1"
	}
	if cfg.Redis.Address == "" {
		cfg.Redis.Address = "127.0.0.1:6379"
	}
	if cfg.Asynq.Concurrency <= 0 {
		cfg.Asynq.Concurrency = 10
	}
	if cfg.Asynq.ImportLargeRowThreshold <= 0 {
		cfg.Asynq.ImportLargeRowThreshold = 500
	}
	if cfg.EmployeeImport.BatchSize <= 0 {
		cfg.EmployeeImport.BatchSize = 150
	}
	if cfg.EmployeeImport.ParallelBatches <= 0 {
		cfg.EmployeeImport.ParallelBatches = 8
	}
	if cfg.Storage.UploadDir == "" {
		cfg.Storage.UploadDir = "uploads"
	}
	if cfg.Storage.ExportDir == "" {
		cfg.Storage.ExportDir = "exports"
	}
	if cfg.Storage.TemplatesDir == "" {
		cfg.Storage.TemplatesDir = "templates"
	}
}

func projectRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	// Docker / published layout: appsettings.json next to the binary (no go.mod in image).
	if wd, err := os.Getwd(); err == nil {
		if _, err := os.Stat(filepath.Join(wd, "appsettings.json")); err == nil {
			return wd, nil
		}
	}
	if exe, err := os.Executable(); err == nil {
		root := filepath.Dir(exe)
		if _, err := os.Stat(filepath.Join(root, "appsettings.json")); err == nil {
			return root, nil
		}
	}
	return "", fmt.Errorf("go.mod not found")
}

func NormalizeSQLServerDSN(cs string) string {
	trimmed := strings.TrimSpace(cs)
	if strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		return trimmed
	}
	// Minimal ADO -> URL (reuse logic pattern from punchdata - simplified)
	parts := strings.Split(trimmed, ";")
	kv := map[string]string{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		idx := strings.Index(p, "=")
		if idx <= 0 {
			continue
		}
		k := strings.ToLower(strings.TrimSpace(p[:idx]))
		v := strings.TrimSpace(p[idx+1:])
		kv[k] = v
	}
	server := first(kv, "server", "data source")
	database := first(kv, "database", "initial catalog")
	user := first(kv, "user id", "uid")
	password := first(kv, "password", "pwd")
	trusted := strings.EqualFold(kv["trusted_connection"], "true") ||
		strings.EqualFold(kv["integrated security"], "true") ||
		strings.EqualFold(kv["integrated security"], "sspi")

	host, instance, port := parseServer(server)
	if port == "" && instance == "" {
		port = "1433"
	}
	// Local instance: prefer named pipe / shared memory (no SQL Browser required).
	if port == "" && instance != "" && isLocalSQLHost(host) {
		if dsn := buildLocalInstanceDSN(host, instance, database, trusted, kv); dsn != "" {
			return dsn
		}
	}
	q := []string{}
	if database != "" {
		q = append(q, "database="+esc(database))
	}
	if port != "" {
		q = append(q, "port="+esc(port))
	}
	trustCert := false
	if strings.EqualFold(kv["trustservercertificate"], "true") {
		trustCert = true
		q = append(q, "trustservercertificate=true")
	}
	if v, ok := kv["encrypt"]; ok {
		switch strings.ToLower(v) {
		case "mandatory", "true", "yes":
			q = append(q, "encrypt=true")
		case "optional", "false", "no":
			q = append(q, "encrypt=disable")
		case "strict":
			q = append(q, "encrypt=strict")
		}
	}
	if trustCert {
		q = append(q, "tlsmin=1.0")
	}
	if strings.EqualFold(kv["multipleactiveresultsets"], "true") {
		q = append(q, "MultipleActiveResultSets=true")
	}
	if trusted {
		q = append(q, "trusted_connection=true")
	}
	auth := ""
	if user != "" {
		auth = esc(user)
		if password != "" {
			auth += ":" + esc(password)
		}
		auth += "@"
	}
	dsn := "sqlserver://" + auth + esc(host)
	if instance != "" {
		dsn += "/" + esc(instance)
	}
	if len(q) > 0 {
		dsn += "?" + strings.Join(q, "&")
	}
	return dsn
}

func buildLocalInstanceDSN(host, instance, database string, trusted bool, kv map[string]string) string {
	// Shared memory (lpc) works for local SHAKIL\SQLEXPRESS without SQL Browser/TCP.
	return buildADO("lpc:"+host+`\`+instance, database, trusted, kv)
}

func buildLocalURL(instance, database string, trusted bool, kv map[string]string) string {
	q := []string{
		"database=" + esc(database),
		"protocol=np",
		"pipe=" + esc("MSSQL$"+instance+`\sql\query`),
		"trustservercertificate=true",
		"encrypt=disable",
	}
	if trusted {
		q = append(q, "trusted_connection=true")
	}
	if strings.EqualFold(kv["multipleactiveresultsets"], "true") {
		q = append(q, "MultipleActiveResultSets=true")
	}
	// Empty user before host enables Windows SSPI (see go-mssqldb docs).
	return "sqlserver://@localhost/" + esc(instance) + "?" + strings.Join(q, "&")
}

func buildADO(server, database string, trusted bool, kv map[string]string, extra ...string) string {
	parts := []string{"server=" + server, "database=" + database, "encrypt=disable", "TrustServerCertificate=true"}
	if trusted {
		parts = append(parts, "trusted_connection=true")
	}
	parts = append(parts, extra...)
	if strings.EqualFold(kv["multipleactiveresultsets"], "true") {
		parts = append(parts, "MultipleActiveResultSets=true")
	}
	return strings.Join(parts, ";")
}

func buildTCPADO(server, port, database, user, password string, trusted bool, kv map[string]string) string {
	host, instance, _ := parseServer(server)
	if port == "" {
		return ""
	}
	tcpServer := host
	if instance != "" {
		tcpServer = host + "\\" + instance
	}
	tcpServer += "," + port
	parts := []string{"server=" + tcpServer, "database=" + database, "TrustServerCertificate=True"}
	if trusted {
		parts = append(parts, "Trusted_Connection=True")
	} else if user != "" {
		parts = append(parts, "user id="+user)
		if password != "" {
			parts = append(parts, "password="+password)
		}
	}
	if strings.EqualFold(kv["multipleactiveresultsets"], "true") {
		parts = append(parts, "MultipleActiveResultSets=true")
	}
	return strings.Join(parts, ";")
}

// ConnectionStringCandidates returns DSN variants to try (pipe paths, then TCP).
func ConnectionStringCandidates(cs string) []string {
	trimmed := strings.TrimSpace(cs)
	seen := map[string]struct{}{}
	var out []string
	add := func(dsn string) {
		dsn = strings.TrimSpace(dsn)
		if dsn == "" {
			return
		}
		if _, ok := seen[dsn]; ok {
			return
		}
		seen[dsn] = struct{}{}
		out = append(out, dsn)
	}
	// Prefer the original ADO string first (same as .NET / sqlcmd).
	if !strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		add(trimmed)
	}
	add(NormalizeSQLServerDSN(cs))
	if strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		return out
	}
	parts := strings.Split(trimmed, ";")
	kv := map[string]string{}
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		idx := strings.Index(p, "=")
		if idx <= 0 {
			continue
		}
		k := strings.ToLower(strings.TrimSpace(p[:idx]))
		kv[k] = strings.TrimSpace(p[idx+1:])
	}
	server := first(kv, "server", "data source")
	database := first(kv, "database", "initial catalog")
	user := first(kv, "user id", "uid")
	password := first(kv, "password", "pwd")
	trusted := strings.EqualFold(kv["trusted_connection"], "true") ||
		strings.EqualFold(kv["integrated security"], "true") ||
		strings.EqualFold(kv["integrated security"], "sspi")
	host, instance, port := parseServer(server)
	if port != "" || instance == "" {
		return out
	}
	if !isLocalSQLHost(host) && !strings.EqualFold(host, ".") && !strings.EqualFold(host, "(local)") {
		return out
	}
	alternates := []string{
		buildLocalURL(instance, "master", trusted, kv),
		buildADO("lpc:"+host+`\`+instance, database, trusted, kv),
		buildADO(".", database, trusted, kv, "protocol=np", "pipe=MSSQL$"+instance+`\sql\query`),
		buildADO(host+`\`+instance, database, trusted, kv),
	}
	for _, dsn := range alternates {
		add(dsn)
	}
	for _, tcpPort := range []string{"1433", "49172", "1434"} {
		add(buildTCPADO(server, tcpPort, database, user, password, trusted, kv))
	}
	return out
}

func isLocalSQLHost(host string) bool {
	switch strings.ToLower(strings.TrimSpace(host)) {
	case "", ".", "(local)", "localhost", "127.0.0.1", "::1":
		return true
	default:
		// Machine name when connecting to local SQLEXPRESS (e.g. SHAKIL\SQLEXPRESS).
		if hn, err := os.Hostname(); err == nil && strings.EqualFold(host, hn) {
			return true
		}
		// Common local aliases for Express on the same machine.
		if strings.Contains(strings.ToUpper(host), "SHAKIL") || strings.Contains(strings.ToUpper(host), "SQLEXPRESS") {
			return true
		}
		return false
	}
}

func parseServer(server string) (host, instance, port string) {
	if server == "" {
		return "", "", ""
	}
	if strings.Contains(server, "\\") {
		bits := strings.SplitN(server, "\\", 2)
		host = bits[0]
		instance = bits[1]
	} else if strings.Contains(server, ",") {
		bits := strings.SplitN(server, ",", 2)
		host = bits[0]
		port = bits[1]
	} else {
		host = server
	}
	return host, instance, port
}

func first(m map[string]string, keys ...string) string {
	for _, k := range keys {
		if v := strings.TrimSpace(m[k]); v != "" {
			return v
		}
	}
	return ""
}

func esc(v string) string {
	v = strings.ReplaceAll(v, " ", "%20")
	v = strings.ReplaceAll(v, "@", "%40")
	return v
}
