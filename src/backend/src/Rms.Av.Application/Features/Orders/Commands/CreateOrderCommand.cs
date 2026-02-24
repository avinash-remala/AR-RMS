using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Orders.Commands;

public record CreateOrderCommand(CreateOrderDto OrderDto) : IRequest<OrderDto>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateOrderCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<OrderDto> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // Ensure customer exists
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.OrderDto.CustomerId, cancellationToken);
        if (customer == null)
            throw new KeyNotFoundException("Customer not found");

        var order = _mapper.Map<Order>(request.OrderDto);
        order.OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Random.Shared.Next(100, 999)}";
        order.OrderDate = DateTime.UtcNow;
        order.Status = OrderStatus.Pending;

        // Resolve menu item prices and build items
        var itemIds = request.OrderDto.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var items = (await _unitOfWork.MenuItems.FindAsync(m => itemIds.Contains(m.Id), cancellationToken)).ToList();
        if (items.Count != itemIds.Count)
            throw new KeyNotFoundException("One or more menu items not found");

        order.Items = request.OrderDto.Items.Select(dto =>
        {
            var menuItem = items.First(m => m.Id == dto.MenuItemId);
            return new OrderItem
            {
                MenuItemId = menuItem.Id,
                Quantity = dto.Quantity,
                Price = menuItem.Price
            };
        }).ToList();

        var extraIds = request.OrderDto.Extras.Select(e => e.ExtraItemId).Distinct().ToList();
        if (extraIds.Any())
        {
            var extras = (await _unitOfWork.ExtraItems.FindAsync(e => extraIds.Contains(e.Id), cancellationToken)).ToList();
            if (extras.Count != extraIds.Count)
                throw new KeyNotFoundException("One or more extra items not found");

            order.Extras = request.OrderDto.Extras.Select(dto =>
            {
                var extra = extras.First(e => e.Id == dto.ExtraItemId);
                return new OrderExtra
                {
                    ExtraItemId = extra.Id,
                    Quantity = dto.Quantity,
                    Price = extra.Price
                };
            }).ToList();
        }

        order.TotalAmount = order.Items.Sum(i => i.Price * i.Quantity) +
                            order.Extras.Sum(e => e.Price * e.Quantity);

        // Apply meal pass if provided
        if (request.OrderDto.MealPassId.HasValue)
        {
            var pass = await _unitOfWork.MealPasses.GetByIdAsync(request.OrderDto.MealPassId.Value, cancellationToken);
            if (pass == null)
                throw new KeyNotFoundException("Meal pass not found");
            if (!pass.IsActive)
                throw new InvalidOperationException("Meal pass is not active");
            if (pass.CustomerId != order.CustomerId)
                throw new InvalidOperationException("Meal pass does not belong to this customer");

            // Identify comfort box items (Category == "" and name contains "Comfort")
            var comfortItems = order.Items
                .Where(oi => items.Any(m => m.Id == oi.MenuItemId
                    && m.Category == ""
                    && m.Name.Contains("Comfort", StringComparison.OrdinalIgnoreCase)))
                .ToList();

            var mealsToUse = comfortItems.Sum(oi => oi.Quantity);
            if (mealsToUse == 0)
                throw new InvalidOperationException("Meal pass can only be used when ordering comfort boxes");
            if (pass.MealsRemaining < mealsToUse)
                throw new InvalidOperationException($"Not enough meals remaining. Available: {pass.MealsRemaining}, Required: {mealsToUse}");

            var discount = comfortItems.Sum(oi => oi.Price * oi.Quantity);
            order.DiscountAmount = discount;
            order.TotalAmount = Math.Max(0, order.TotalAmount - discount);
            order.MealPassId = pass.Id;

            pass.MealsUsed += mealsToUse;
            pass.LastUsedAt = DateTime.UtcNow;
            pass.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.MealPasses.Update(pass);
        }

        await _unitOfWork.Orders.AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<OrderDto>(order);
        return result;
    }
}
