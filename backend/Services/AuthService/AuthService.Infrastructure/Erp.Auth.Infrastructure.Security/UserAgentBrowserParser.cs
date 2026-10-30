namespace AuthService.Infrastructure.Security;

public static class UserAgentBrowserParser
{
	public static (string? DeviceName, string? Browser, string? OperatingSystem) Parse(string? userAgent)
	{
		if (string.IsNullOrWhiteSpace(userAgent))
		{
			return (null, null, null);
		}
		string ua = userAgent;
		string os = "Unknown";
		if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase))
		{
			os = "Windows";
		}
		else if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase))
		{
			os = "Android";
		}
		else if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase) || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase) || ua.Contains("iOS", StringComparison.OrdinalIgnoreCase))
		{
			os = "iOS";
		}
		else if (ua.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase) || ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase))
		{
			os = "macOS";
		}
		else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase))
		{
			os = "Linux";
		}
		string browser = "Unknown";
		if (ua.Contains("Edg/", StringComparison.Ordinal))
		{
			browser = "Edge";
		}
		else if (ua.Contains("Chrome/", StringComparison.Ordinal) && !ua.Contains("Edg/", StringComparison.Ordinal))
		{
			browser = "Chrome";
		}
		else if (ua.Contains("Firefox/", StringComparison.Ordinal))
		{
			browser = "Firefox";
		}
		else if (ua.Contains("Safari/", StringComparison.Ordinal) && !ua.Contains("Chrome/", StringComparison.Ordinal))
		{
			browser = "Safari";
		}
		return ("Web", browser, os);
	}
}
