var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Cutting", phase = "shell-host", port = 5044 });
app.MapGet("/api/v1/cutting", info);
app.MapGet("/api/v1/cutting/{**path}", info);
app.Urls.Add("http://0.0.0.0:5044");
await app.RunAsync();