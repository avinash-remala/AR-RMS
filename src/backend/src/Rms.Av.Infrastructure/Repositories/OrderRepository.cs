using Microsoft.EntityFrameworkCore;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Infrastructure.Repositories;

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(RmsAvDbContext context) : base(context) { }

    public async Task<IEnumerable<Order>> GetOrdersAsync(DateTime? date = null, CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .Include(o => o.Items)
            .Include(o => o.Extras)
            .AsNoTracking()
            .AsQueryable();

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(o => o.OrderDate.Date == targetDate);
        }

        return await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Order?> GetOrderWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(o => o.Items)
            .Include(o => o.Extras)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }
}
