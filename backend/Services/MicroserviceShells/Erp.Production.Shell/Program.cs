var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Production", phase = "shell-host", port = 5042 });
app.MapGet("/api/v1/production", info);
app.MapGet("/api/v1/production/{**path}", info);
app.Urls.Add("http://0.0.0.0:5042");
await app.RunAsync();