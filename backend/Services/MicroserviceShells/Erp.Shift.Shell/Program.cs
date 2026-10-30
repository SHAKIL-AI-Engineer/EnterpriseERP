var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Shift", phase = "shell-host", port = 5036 });
app.MapGet("/api/v1/shift", info);
app.MapGet("/api/v1/shift/{**path}", info);
app.Urls.Add("http://0.0.0.0:5036");
await app.RunAsync();