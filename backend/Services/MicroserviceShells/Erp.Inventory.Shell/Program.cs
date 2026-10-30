var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Inventory", phase = "shell-host", port = 5041 });
app.MapGet("/api/v1/inventory", info);
app.MapGet("/api/v1/inventory/{**path}", info);
app.Urls.Add("http://0.0.0.0:5041");
await app.RunAsync();