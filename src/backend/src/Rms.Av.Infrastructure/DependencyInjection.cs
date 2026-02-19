using Microsoft.Extensions.DependencyInjection;
using Rms.Av.Application.Interfaces;
using Rms.Av.Application.Services;
using Rms.Av.Infrastructure.Repositories;
using Rms.Av.Infrastructure.Services;

namespace Rms.Av.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register Generic Repository
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IOrderRepository, OrderRepository>();

        // Register SMS & OTP Services
        services.AddSingleton<ISmsService, AwsSnsService>();
        services.AddScoped<OtpService>();
        services.AddMemoryCache(); // For OTP storage

        return services;
    }
}
