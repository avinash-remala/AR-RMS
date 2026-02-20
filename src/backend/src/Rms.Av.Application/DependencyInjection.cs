using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Rms.Av.Application.Interfaces;
using Rms.Av.Application.Services;
using System.Reflection;

namespace Rms.Av.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register AutoMapper
        services.AddAutoMapper(assembly);

        // Register MediatR
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(assembly));

        // Register FluentValidation
        services.AddValidatorsFromAssembly(assembly);

        // Register application services
        services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();

        return services;
    }
}
