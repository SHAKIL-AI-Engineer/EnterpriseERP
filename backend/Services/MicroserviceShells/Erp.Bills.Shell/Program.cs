var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Bills", phase = "shell-host", port = 5045 });
app.MapGet("/api/v1/bills", info);
app.MapGet("/api/v1/bills/{**path}", info);
app.Urls.Add("http://0.0.0.0:5045");
await app.RunAsync();