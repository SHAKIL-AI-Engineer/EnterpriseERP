var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Report", phase = "shell-host", port = 5046 });
app.MapGet("/api/v1/report", info);
app.MapGet("/api/v1/report/{**path}", info);
app.Urls.Add("http://0.0.0.0:5046");
await app.RunAsync();