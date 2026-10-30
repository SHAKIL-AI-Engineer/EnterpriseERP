var b = WebApplication.CreateBuilder(args);
b.Services.AddHealthChecks();
var app = b.Build();
app.MapHealthChecks("/health");
var info = () => Results.Json(new { service = "Payroll", phase = "shell-host", port = 5039 });
app.MapGet("/api/v1/payroll", info);
app.MapGet("/api/v1/payroll/{**path}", info);
app.Urls.Add("http://0.0.0.0:5039");
await app.RunAsync();