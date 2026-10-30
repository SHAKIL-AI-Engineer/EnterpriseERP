var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "FileStorage", phase = "shell-host", port = 5049 });
app.MapGet("/api/v1/filestorage", info);
app.MapGet("/api/v1/filestorage/{**path}", info);
app.Urls.Add("http://0.0.0.0:5049");
await app.RunAsync();