var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Accounts", phase = "shell-host", port = 5040 });
app.MapGet("/api/v1/accounts", info);
app.MapGet("/api/v1/accounts/{**path}", info);
app.Urls.Add("http://0.0.0.0:5040");
await app.RunAsync();