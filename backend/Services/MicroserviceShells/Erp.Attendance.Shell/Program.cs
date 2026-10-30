var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Attendance", phase = "shell-host", port = 5037 });
app.MapGet("/api/v1/attendance", info);
app.MapGet("/api/v1/attendance/{**path}", info);
app.Urls.Add("http://0.0.0.0:5037");
await app.RunAsync();