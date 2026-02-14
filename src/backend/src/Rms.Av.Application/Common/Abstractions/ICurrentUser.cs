namespace Rms.Av.Application.Common.Abstractions;

public interface ICurrentUser
{
    string? CustomerId { get; }
    string? UserName { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}
