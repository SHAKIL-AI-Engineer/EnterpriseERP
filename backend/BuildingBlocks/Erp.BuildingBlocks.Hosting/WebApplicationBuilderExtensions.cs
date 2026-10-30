using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.FileProviders;

namespace Erp.BuildingBlocks.Hosting;

/// <summary>
/// Loads <c>connectionstrings.json</c> from the application output directory (MSBuild copies it from <c>Configuration/connectionstrings.json</c>).
/// Uses <see cref="AppContext.BaseDirectory"/> because that file is emitted next to the built assembly, not under the project content root.
/// Inserts this source after <c>appsettings*.json</c> so user secrets, environment variables, and command-line arguments still override these values.
/// </summary>
public static class WebApplicationBuilderExtensions
{
	public static WebApplicationBuilder AddEnterpriseErpConnectionConfiguration(this WebApplicationBuilder builder)
	{
		var outputFileProvider = new PhysicalFileProvider(AppContext.BaseDirectory);
		var jsonSource = new JsonConfigurationSource
		{
			Path = "connectionstrings.json",
			Optional = true,
			ReloadOnChange = true,
			FileProvider = outputFileProvider
		};

		IList<IConfigurationSource> sources = builder.Configuration.Sources;
		int insertAt = -1;
		for (int i = 0; i < sources.Count; i++)
		{
			if (sources[i] is FileConfigurationSource { Path: string path } &&
			    path.StartsWith("appsettings", StringComparison.OrdinalIgnoreCase))
			{
				insertAt = i + 1;
			}
		}

		if (insertAt >= 0 && insertAt <= sources.Count)
		{
			sources.Insert(insertAt, jsonSource);
		}
		else
		{
			builder.Configuration.AddJsonFile(outputFileProvider, "connectionstrings.json", optional: true, reloadOnChange: true);
		}

		return builder;
	}
}
