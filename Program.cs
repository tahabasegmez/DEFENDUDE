using DEFENDUDE.Application.System;
using DEFENDUDE.Infrastructure;
using DEFENDUDE.Web.Configuration;
using DEFENDUDE.Web.Endpoints;
using DEFENDUDE.Web.Errors;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppOptions>(
    builder.Configuration.GetSection(AppOptions.SectionName));

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();

builder.Services.AddScoped<GetSystemInfoQueryHandler>();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHealthChecks("/health");

var api = app.MapGroup("/api");
api.MapSystemEndpoints();

app.MapFallbackToFile("index.html");

app.Run();
