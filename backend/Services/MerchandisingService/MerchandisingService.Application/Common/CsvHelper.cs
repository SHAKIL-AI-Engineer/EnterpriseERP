using System.Globalization;
using System.Text;

namespace MerchandisingService.Application.Common;

internal static class CsvHelper
{
    public static byte[] BuildTemplate(params string[] headers)
    {
        using var ms = new MemoryStream();
        WriteRow(ms, headers);
        return ms.ToArray();
    }

    public static byte[] BuildCsv(IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<string>> rows)
    {
        using var ms = new MemoryStream();
        WriteRow(ms, headers);
        foreach (var row in rows)
        {
            WriteRow(ms, row);
        }

        return ms.ToArray();
    }

    public static IReadOnlyList<Dictionary<string, string>> Parse(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var headerLine = reader.ReadLine();
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            throw new InvalidOperationException("CSV file is empty.");
        }

        var headers = ParseLine(headerLine).Select(NormalizeHeader).ToList();
        if (headers.Count == 0)
        {
            throw new InvalidOperationException("CSV header row is missing.");
        }

        var rows = new List<Dictionary<string, string>>();
        string? line;
        while ((line = reader.ReadLine()) is not null)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            var values = ParseLine(line);
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < headers.Count; i++)
            {
                row[headers[i]] = i < values.Count ? values[i].Trim() : string.Empty;
            }

            rows.Add(row);
        }

        return rows;
    }

    private static void WriteRow(Stream stream, IReadOnlyList<string> values)
    {
        var line = string.Join(",", values.Select(Escape));
        var bytes = Encoding.UTF8.GetBytes(line + Environment.NewLine);
        stream.Write(bytes, 0, bytes.Length);
    }

    private static string Escape(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n') || value.Contains('\r'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }

        return value;
    }

    private static string NormalizeHeader(string header) =>
        header.Trim().Replace(" ", string.Empty, StringComparison.Ordinal);

    private static List<string> ParseLine(string line)
    {
        var values = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }

                continue;
            }

            if (c == ',' && !inQuotes)
            {
                values.Add(current.ToString());
                current.Clear();
                continue;
            }

            current.Append(c);
        }

        values.Add(current.ToString());
        return values;
    }

    public static bool TryParseDate(string value, out DateOnly date)
    {
        if (DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
        {
            return true;
        }

        return DateOnly.TryParse(value, CultureInfo.CurrentCulture, DateTimeStyles.None, out date);
    }

    public static string Get(Dictionary<string, string> row, params string[] keys)
    {
        foreach (var key in keys)
        {
            if (row.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }
}
