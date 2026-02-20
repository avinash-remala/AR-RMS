using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Infrastructure.Persistence;
using Rms.Av.Application;
using Rms.Av.Infrastructure;
using Rms.Av.Api.Middleware;
using QuestPDF.Infrastructure;

// Configure QuestPDF license (Community license for non-commercial use)
QuestPDF.Settings.License = LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure SQLite Database
builder.Services.AddDbContext<RmsAvDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=rmsav.db"));

// Add Application Layer services (MediatR, AutoMapper, FluentValidation)
builder.Services.AddApplication();

// Add Infrastructure Layer services (Repositories, Unit of Work)
builder.Services.AddInfrastructure();

// Validation & error handling
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Only use HTTPS redirection in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS must come early in the pipeline
app.UseCors("AllowReactApp");

// Routing
app.UseRouting();

// Exception handling
app.UseExceptionHandler(_ => { }); // handled by GlobalExceptionHandler
app.UseStatusCodePages();

// Map endpoints
app.MapControllers();

// Apply migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<RmsAvDbContext>();
    db.Database.Migrate();
}

app.Run();
