FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/Rms.Av.Api/Rms.Av.Api.csproj", "src/Rms.Av.Api/"]
COPY ["src/Rms.Av.Application/Rms.Av.Application.csproj", "src/Rms.Av.Application/"]
COPY ["src/Rms.Av.Domain/Rms.Av.Domain.csproj", "src/Rms.Av.Domain/"]
COPY ["src/Rms.Av.Infrastructure/Rms.Av.Infrastructure.csproj", "src/Rms.Av.Infrastructure/"]
RUN dotnet restore "src/Rms.Av.Api/Rms.Av.Api.csproj"

COPY . .
WORKDIR "/src/src/Rms.Av.Api"
RUN dotnet publish "Rms.Av.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Directory for SQLite volume mount
RUN mkdir -p /data

ENV PORT=8080
CMD sh -c "ASPNETCORE_URLS=http://0.0.0.0:${PORT} dotnet Rms.Av.Api.dll"
