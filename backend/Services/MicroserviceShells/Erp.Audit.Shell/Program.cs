var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Audit", phase = "shell-host", port = 5048 });
app.MapGet("/api/v1/audit", info);
app.MapGet("/api/v1/audit/{**path}", info);
app.Urls.Add("http://0.0.0.0:5048");
await app.RunAsync();