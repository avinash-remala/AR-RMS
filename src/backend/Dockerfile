# Backend Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["src/Rms.Av.Api/Rms.Av.Api.csproj", "src/Rms.Av.Api/"]
COPY ["src/Rms.Av.Application/Rms.Av.Application.csproj", "src/Rms.Av.Application/"]
COPY ["src/Rms.Av.Domain/Rms.Av.Domain.csproj", "src/Rms.Av.Domain/"]
COPY ["src/Rms.Av.Infrastructure/Rms.Av.Infrastructure.csproj", "src/Rms.Av.Infrastructure/"]
RUN dotnet restore "src/Rms.Av.Api/Rms.Av.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/Rms.Av.Api"
RUN dotnet build "Rms.Av.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Rms.Av.Api.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Rms.Av.Api.dll"]
