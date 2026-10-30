package config

import (
	"os"
	"strings"
)

// ConnectionStringCandidates returns DSN variants to try (shared memory, named pipe, then TCP).
// Mirrors ImportExportService so local SQLEXPRESS works when SQL Browser is disabled.
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

func NormalizeSQLServerDSN(cs string) string {
	trimmed := strings.TrimSpace(cs)
	if strings.HasPrefix(strings.ToLower(trimmed), "sqlserver://") {
		return trimmed
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

func isLocalSQLHost(host string) bool {
	switch strings.ToLower(strings.TrimSpace(host)) {
	case "", ".", "(local)", "localhost", "127.0.0.1", "::1":
		return true
	default:
		if hn, err := os.Hostname(); err == nil && strings.EqualFold(host, hn) {
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
