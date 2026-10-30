var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Merchandising", phase = "shell-host", port = 5043 });
app.MapGet("/api/v1/merchandising", info);
app.MapGet("/api/v1/merchandising/{**path}", info);
app.Urls.Add("http://0.0.0.0:5043");
await app.RunAsync();