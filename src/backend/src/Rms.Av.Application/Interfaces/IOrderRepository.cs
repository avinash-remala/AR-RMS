using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Interfaces;

/// <summary>
/// Specialized repository for orders supporting eager loading of item details.
/// </summary>
public interface IOrderRepository : IRepository<Order>
{
    Task<IEnumerable<Order>> GetOrdersAsync(DateTime? date = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime? fromDate, DateTime? toDate, string? buildingNumber = null, CancellationToken cancellationToken = default);
    Task<Order?> GetOrderWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Order?> GetLastOrderByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);
}
