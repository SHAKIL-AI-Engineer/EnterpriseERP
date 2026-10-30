using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace AuthService.Infrastructure.Persistence;

/// <summary>
/// EF Core design-time factory for <c>dotnet ef migrations</c> / <c>dotnet ef database update</c>.
/// Locates <c>AuthService.Api/appsettings.json</c> by walking up from the current directory, then merges
/// repo <c>Configuration/connectionstrings.json</c> when present (same central file as the ASP.NET hosts).
/// Environment variables are applied last so they override file-based values. Falls back to LocalDB <c>AuthServiceDB</c>.
/// </summary>
public sealed class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
	private const string DefaultConnection =
		"Server=localhost;Database=AuthServiceDB;User Id=sa;Password=123580;Encrypt=Mandatory;TrustServerCertificate=True;MultipleActiveResultSets=true";

	public AuthDbContext CreateDbContext(string[] args)
	{
		string? apiRoot = FindAuthApiDirectory();
		IConfigurationBuilder builder = new ConfigurationBuilder();
		if (apiRoot != null)
		{
			builder.SetBasePath(apiRoot)
				.AddJsonFile("appsettings.json", optional: false)
				.AddJsonFile("appsettings.Development.json", optional: true);
			string? central = FindCentralConnectionStringsPath(apiRoot);
			if (central != null)
			{
				builder.AddJsonFile(central, optional: true);
			}
			else
			{
				builder.AddJsonFile(Path.Combine(apiRoot, "connectionstrings.json"), optional: true);
			}
		}

		builder.AddEnvironmentVariables();
		IConfigurationRoot configuration = builder.Build();
		string connectionString = configuration.GetConnectionString("AuthDb") ?? DefaultConnection;
		DbContextOptionsBuilder<AuthDbContext> optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();
		optionsBuilder.UseSqlServer(connectionString, sql =>
			sql.MigrationsAssembly(typeof(AuthDbContext).Assembly.GetName().Name));
		return new AuthDbContext(optionsBuilder.Options);
	}

	private static string? FindAuthApiDirectory()
	{
		string dir = Directory.GetCurrentDirectory();
		for (int i = 0; i < 12; i++)
		{
			string apiRoot = Path.Combine(dir, "AuthService.Api");
			string settings = Path.Combine(apiRoot, "appsettings.json");
			if (File.Exists(settings))
			{
				return apiRoot;
			}
			if (dir.EndsWith("AuthService.Api", StringComparison.OrdinalIgnoreCase) && File.Exists(Path.Combine(dir, "appsettings.json")))
			{
				return dir;
			}
			DirectoryInfo? parent = Directory.GetParent(dir);
			if (parent == null)
			{
				break;
			}
			dir = parent.FullName;
		}
		return null;
	}

	private static string? FindCentralConnectionStringsPath(string startDir)
	{
		string dir = startDir;
		for (int i = 0; i < 16; i++)
		{
			string candidate = Path.Combine(dir, "Configuration", "connectionstrings.json");
			if (File.Exists(candidate))
			{
				return candidate;
			}

			DirectoryInfo? parent = Directory.GetParent(dir);
			if (parent == null)
			{
				break;
			}

			dir = parent.FullName;
		}

		return null;
	}
}
