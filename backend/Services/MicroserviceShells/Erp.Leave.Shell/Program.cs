var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Leave", phase = "shell-host", port = 5038 });
app.MapGet("/api/v1/leave", info);
app.MapGet("/api/v1/leave/{**path}", info);
app.Urls.Add("http://0.0.0.0:5038");
await app.RunAsync();