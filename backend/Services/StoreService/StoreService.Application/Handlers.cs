using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;
using StoreService.Contracts;
using StoreService.Domain;

namespace StoreService.Application;

internal static class StoreHandlerSupport
{
    public static string NextNumber(string prefix) => $"{prefix}-{BusinessTime.Now:yyyyMMddHHmmssfff}";

    public static async Task<StoreItem> LoadItem(IStoreDbContext db, Guid companyId, Guid itemId, CancellationToken ct) =>
        await db.Items
            .Include(x => x.Category)
            .Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == itemId && x.CompanyId == companyId, ct)
        ?? throw new KeyNotFoundException("Store item not found.");

    public static async Task ApplyStockChange(
        IStoreDbContext db,
        IInventorySyncClient inventory,
        StoreItem item,
        string transactionType,
        decimal quantity,
        StockMovementRequest request,
        CancellationToken ct)
    {
        if (quantity <= 0)
        {
            throw new InvalidOperationException("Quantity must be greater than zero.");
        }

        if (transactionType == StoreTransactionTypes.Out && item.CurrentStock < quantity)
        {
            throw new InvalidOperationException("Insufficient stock for this item.");
        }

        if (transactionType == StoreTransactionTypes.In)
        {
            item.CurrentStock += quantity;
        }
        else
        {
            item.CurrentStock -= quantity;
        }

        item.UpdatedAt = BusinessTime.Now;
        var txn = new StoreStockTransaction
        {
            CompanyId = request.CompanyId,
            TransactionNumber = NextNumber(transactionType == StoreTransactionTypes.In ? "STK-IN" : "STK-OUT"),
            ItemId = item.Id,
            TransactionType = transactionType,
            Quantity = quantity,
            ReferenceNumber = request.ReferenceNumber,
            DepartmentOrLine = request.DepartmentOrLine,
            LocationOrBin = request.LocationOrBin,
            SupplierName = request.SupplierName,
            TransactionDate = request.TransactionDate ?? BusinessTime.Now,
        };
        db.Add(txn);

        var unitName = item.Unit?.UnitName ?? item.Unit?.ShortName ?? "EA";
        if (transactionType == StoreTransactionTypes.In)
        {
            var inventoryId = await inventory.ReceiveAsync(
                item.CompanyId, item.ItemCode, item.ItemName, unitName, quantity, request.ReferenceNumber, ct);
            if (inventoryId.HasValue)
            {
                item.InventoryItemId = inventoryId;
            }
        }
        else if (item.InventoryItemId.HasValue)
        {
            await inventory.IssueAsync(item.CompanyId, item.InventoryItemId.Value, quantity, request.ReferenceNumber, ct);
        }
    }

    public static void RefreshBookingStatus(StoreBooking booking)
    {
        if (booking.IssuedQty <= 0)
        {
            booking.Status = StoreBookingStatuses.Pending;
        }
        else if (booking.IssuedQty >= booking.BookedQuantity)
        {
            booking.Status = StoreBookingStatuses.Completed;
        }
        else
        {
            booking.Status = StoreBookingStatuses.Partial;
        }
    }
}

// Categories
public sealed class CategoryHandlers(IStoreDbContext db) :
    IRequestHandler<GetCategoriesQuery, IReadOnlyList<ItemCategoryDto>>,
    IRequestHandler<GetCategoryByIdQuery, ItemCategoryDto>,
    IRequestHandler<CreateCategoryCommand, ItemCategoryDto>,
    IRequestHandler<UpdateCategoryCommand, ItemCategoryDto>,
    IRequestHandler<DeleteCategoryCommand, Unit>
{
    public async Task<IReadOnlyList<ItemCategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Categories.Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.CategoryName).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<ItemCategoryDto> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");
        return entity.ToDto();
    }

    public async Task<ItemCategoryDto> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new ItemCategory { CompanyId = r.CompanyId, CategoryName = r.CategoryName.Trim(), Description = r.Description?.Trim() };
        db.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<ItemCategoryDto> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");
        entity.CategoryName = command.Request.CategoryName.Trim();
        entity.Description = command.Request.Description?.Trim();
        entity.IsActive = command.Request.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<Unit> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");
        if (await db.Items.AnyAsync(x => x.CategoryId == entity.Id, cancellationToken))
        {
            throw new InvalidOperationException("Cannot delete category that is used by items.");
        }

        entity.IsActive = false;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// Units
public sealed class UnitHandlers(IStoreDbContext db) :
    IRequestHandler<GetUnitsQuery, IReadOnlyList<StoreUnitDto>>,
    IRequestHandler<GetUnitByIdQuery, StoreUnitDto>,
    IRequestHandler<CreateUnitCommand, StoreUnitDto>,
    IRequestHandler<UpdateUnitCommand, StoreUnitDto>,
    IRequestHandler<DeleteUnitCommand, Unit>
{
    public async Task<IReadOnlyList<StoreUnitDto>> Handle(GetUnitsQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Units.Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.UnitName).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StoreUnitDto> Handle(GetUnitByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await db.Units.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Unit not found.");
        return entity.ToDto();
    }

    public async Task<StoreUnitDto> Handle(CreateUnitCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new StoreUnit { CompanyId = r.CompanyId, UnitName = r.UnitName.Trim(), ShortName = r.ShortName.Trim(), UnitType = r.UnitType?.Trim() };
        db.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<StoreUnitDto> Handle(UpdateUnitCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Units.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Unit not found.");
        entity.UnitName = command.Request.UnitName.Trim();
        entity.ShortName = command.Request.ShortName.Trim();
        entity.UnitType = command.Request.UnitType?.Trim();
        entity.IsActive = command.Request.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<Unit> Handle(DeleteUnitCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.Units.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Unit not found.");
        if (await db.Items.AnyAsync(x => x.UnitId == entity.Id, cancellationToken))
        {
            throw new InvalidOperationException("Cannot delete unit that is used by items.");
        }

        entity.IsActive = false;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// Items
public sealed class ItemHandlers(IStoreDbContext db) :
    IRequestHandler<GetItemsQuery, IReadOnlyList<StoreItemDto>>,
    IRequestHandler<GetItemByIdQuery, StoreItemDto>,
    IRequestHandler<CreateItemCommand, StoreItemDto>,
    IRequestHandler<UpdateItemCommand, StoreItemDto>,
    IRequestHandler<DeleteItemCommand, Unit>
{
    public async Task<IReadOnlyList<StoreItemDto>> Handle(GetItemsQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Items.Include(x => x.Category).Include(x => x.Unit)
            .Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.ItemCode).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StoreItemDto> Handle(GetItemByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await db.Items.Include(x => x.Category).Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Item not found.");
        return entity.ToDto();
    }

    public async Task<StoreItemDto> Handle(CreateItemCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (await db.Items.AnyAsync(x => x.CompanyId == r.CompanyId && x.ItemCode == r.ItemCode.Trim(), cancellationToken))
        {
            throw new InvalidOperationException("Item code already exists.");
        }

        var entity = new StoreItem
        {
            CompanyId = r.CompanyId,
            ItemCode = r.ItemCode.Trim(),
            ItemName = r.ItemName.Trim(),
            CategoryId = r.CategoryId,
            UnitId = r.UnitId,
            OpeningStock = r.OpeningStock,
            CurrentStock = r.OpeningStock,
            MinimumStockLevel = r.MinimumStockLevel,
            UnitPrice = r.UnitPrice,
            Description = r.Description?.Trim(),
        };
        db.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return (await StoreHandlerSupport.LoadItem(db, entity.CompanyId, entity.Id, cancellationToken)).ToDto();
    }

    public async Task<StoreItemDto> Handle(UpdateItemCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Items.Include(x => x.Category).Include(x => x.Unit)
            .FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Item not found.");
        var r = command.Request;
        entity.ItemName = r.ItemName.Trim();
        entity.CategoryId = r.CategoryId;
        entity.UnitId = r.UnitId;
        entity.MinimumStockLevel = r.MinimumStockLevel;
        entity.UnitPrice = r.UnitPrice;
        entity.Description = r.Description?.Trim();
        entity.IsActive = r.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<Unit> Handle(DeleteItemCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.Items.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Item not found.");
        entity.IsActive = false;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// Buyers
public sealed class BuyerHandlers(IStoreDbContext db) :
    IRequestHandler<GetBuyersQuery, IReadOnlyList<StoreBuyerDto>>,
    IRequestHandler<GetBuyerByIdQuery, StoreBuyerDto>,
    IRequestHandler<CreateBuyerCommand, StoreBuyerDto>,
    IRequestHandler<UpdateBuyerCommand, StoreBuyerDto>,
    IRequestHandler<DeleteBuyerCommand, Unit>
{
    public async Task<IReadOnlyList<StoreBuyerDto>> Handle(GetBuyersQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Buyers.Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.BuyerName).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StoreBuyerDto> Handle(GetBuyerByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await db.Buyers.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Buyer not found.");
        return entity.ToDto();
    }

    public async Task<StoreBuyerDto> Handle(CreateBuyerCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var entity = new StoreBuyer
        {
            CompanyId = r.CompanyId,
            BuyerName = r.BuyerName.Trim(),
            Country = r.Country?.Trim(),
            ContactPerson = r.ContactPerson?.Trim(),
            Email = r.Email?.Trim(),
            Phone = r.Phone?.Trim(),
        };
        db.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<StoreBuyerDto> Handle(UpdateBuyerCommand command, CancellationToken cancellationToken)
    {
        var entity = await db.Buyers.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Buyer not found.");
        var r = command.Request;
        entity.BuyerName = r.BuyerName.Trim();
        entity.Country = r.Country?.Trim();
        entity.ContactPerson = r.ContactPerson?.Trim();
        entity.Email = r.Email?.Trim();
        entity.Phone = r.Phone?.Trim();
        entity.IsActive = r.IsActive;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<Unit> Handle(DeleteBuyerCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.Buyers.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Buyer not found.");
        entity.IsActive = false;
        entity.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// Orders
public sealed class OrderHandlers(IStoreDbContext db) :
    IRequestHandler<GetOrdersQuery, IReadOnlyList<StoreOrderDto>>,
    IRequestHandler<GetOrderByIdQuery, StoreOrderDto>,
    IRequestHandler<CreateOrderCommand, StoreOrderDto>,
    IRequestHandler<UpdateOrderCommand, StoreOrderDto>,
    IRequestHandler<DeleteOrderCommand, Unit>
{
    private async Task<StoreOrder> LoadOrder(Guid companyId, Guid id, CancellationToken ct) =>
        await db.Orders
            .Include(x => x.Buyer)
            .Include(x => x.Lines).ThenInclude(l => l.Item)
            .FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId, ct)
        ?? throw new KeyNotFoundException("Order not found.");

    public async Task<IReadOnlyList<StoreOrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Orders.Include(x => x.Buyer).Include(x => x.Lines)
            .Where(x => x.CompanyId == request.CompanyId).OrderByDescending(x => x.OrderDate).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StoreOrderDto> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken) =>
        (await LoadOrder(request.CompanyId, request.Id, cancellationToken)).ToDto();

    public async Task<StoreOrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (!await db.Buyers.AnyAsync(x => x.Id == r.BuyerId && x.CompanyId == r.CompanyId, cancellationToken))
        {
            throw new InvalidOperationException("Buyer not found for company.");
        }

        var order = new StoreOrder
        {
            CompanyId = r.CompanyId,
            OrderNumber = string.IsNullOrWhiteSpace(r.OrderNumber) ? StoreHandlerSupport.NextNumber("ORD") : r.OrderNumber.Trim(),
            BuyerId = r.BuyerId,
            OrderDate = r.OrderDate,
            Remarks = r.Remarks?.Trim(),
        };
        db.Add(order);

        foreach (var line in r.Lines)
        {
            if (!await db.Items.AnyAsync(x => x.Id == line.ItemId && x.CompanyId == r.CompanyId, cancellationToken))
            {
                throw new InvalidOperationException($"Item {line.ItemId} not found.");
            }

            db.Add(new StoreOrderLine
            {
                CompanyId = r.CompanyId,
                OrderId = order.Id,
                ItemId = line.ItemId,
                Quantity = line.Quantity,
                UnitPrice = line.UnitPrice,
                UnitName = line.UnitName?.Trim(),
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        return (await LoadOrder(r.CompanyId, order.Id, cancellationToken)).ToDto();
    }

    public async Task<StoreOrderDto> Handle(UpdateOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await LoadOrder(command.CompanyId, command.Id, cancellationToken);
        order.Status = command.Request.Status.Trim();
        order.Remarks = command.Request.Remarks?.Trim();
        order.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return order.ToDto();
    }

    public async Task<Unit> Handle(DeleteOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await LoadOrder(request.CompanyId, request.Id, cancellationToken);
        if (await db.Bookings.AnyAsync(x => x.OrderId == order.Id, cancellationToken))
        {
            throw new InvalidOperationException("Cannot delete order with existing bookings.");
        }

        foreach (var line in order.Lines.ToList())
        {
            db.Remove(line);
        }

        db.Remove(order);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// Bookings
public sealed class BookingHandlers(IStoreDbContext db, IInventorySyncClient inventory) :
    IRequestHandler<GetBookingsQuery, IReadOnlyList<StoreBookingDto>>,
    IRequestHandler<GetBookingByIdQuery, StoreBookingDto>,
    IRequestHandler<CreateBookingCommand, StoreBookingDto>,
    IRequestHandler<UpdateBookingCommand, StoreBookingDto>,
    IRequestHandler<IssueBookingCommand, StoreBookingDto>,
    IRequestHandler<DeleteBookingCommand, Unit>
{
    private IQueryable<StoreBooking> Query(Guid companyId) =>
        db.Bookings
            .Include(x => x.Order)
            .Include(x => x.Item).ThenInclude(i => i!.Unit)
            .Where(x => x.CompanyId == companyId);

    public async Task<IReadOnlyList<StoreBookingDto>> Handle(GetBookingsQuery request, CancellationToken cancellationToken)
    {
        var q = Query(request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.BookingType))
        {
            q = q.Where(x => x.BookingType == request.BookingType);
        }

        var list = await q.OrderByDescending(x => x.BookingDate).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StoreBookingDto> Handle(GetBookingByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await Query(request.CompanyId).FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");
        return entity.ToDto();
    }

    public async Task<StoreBookingDto> Handle(CreateBookingCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (!await db.Orders.AnyAsync(x => x.Id == r.OrderId && x.CompanyId == r.CompanyId, cancellationToken))
        {
            throw new InvalidOperationException("Order not found.");
        }

        var entity = new StoreBooking
        {
            CompanyId = r.CompanyId,
            BookingNumber = StoreHandlerSupport.NextNumber("BKG"),
            OrderId = r.OrderId,
            ItemId = r.ItemId,
            BookingType = r.BookingType.Trim(),
            BookedQuantity = r.BookedQuantity,
            BookingDate = r.BookingDate,
            Remarks = r.Remarks?.Trim(),
        };
        db.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        return (await Query(r.CompanyId).FirstAsync(x => x.Id == entity.Id, cancellationToken)).ToDto();
    }

    public async Task<StoreBookingDto> Handle(UpdateBookingCommand command, CancellationToken cancellationToken)
    {
        var entity = await Query(command.CompanyId).FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");
        entity.BookedQuantity = command.Request.BookedQuantity;
        entity.Status = command.Request.Status.Trim();
        entity.Remarks = command.Request.Remarks?.Trim();
        entity.UpdatedAt = BusinessTime.Now;
        StoreHandlerSupport.RefreshBookingStatus(entity);
        await db.SaveChangesAsync(cancellationToken);
        return entity.ToDto();
    }

    public async Task<StoreBookingDto> Handle(IssueBookingCommand command, CancellationToken cancellationToken)
    {
        var booking = await Query(command.CompanyId).FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");
        var qty = command.Request.Quantity;
        if (qty <= 0)
        {
            throw new InvalidOperationException("Issue quantity must be greater than zero.");
        }

        if (booking.IssuedQty + qty > booking.BookedQuantity)
        {
            throw new InvalidOperationException("Issue quantity exceeds booked quantity.");
        }

        var item = await StoreHandlerSupport.LoadItem(db, command.CompanyId, booking.ItemId, cancellationToken);
        await StoreHandlerSupport.ApplyStockChange(
            db, inventory, item, StoreTransactionTypes.Out,
            qty,
            new StockMovementRequest(command.CompanyId, booking.ItemId, qty, booking.BookingNumber, null, null, null, null),
            cancellationToken);

        booking.IssuedQty += qty;
        StoreHandlerSupport.RefreshBookingStatus(booking);
        booking.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return booking.ToDto();
    }

    public async Task<Unit> Handle(DeleteBookingCommand request, CancellationToken cancellationToken)
    {
        var entity = await db.Bookings.FirstOrDefaultAsync(x => x.Id == request.Id && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Booking not found.");
        if (entity.IssuedQty > 0)
        {
            throw new InvalidOperationException("Cannot delete booking with issued quantity.");
        }

        db.Remove(entity);
        await db.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

// GRN
public sealed class GrnHandlers(IStoreDbContext db, IInventorySyncClient inventory) :
    IRequestHandler<GetGrnsQuery, IReadOnlyList<GrnDto>>,
    IRequestHandler<GetGrnByIdQuery, GrnDto>,
    IRequestHandler<CreateGrnCommand, GrnDto>,
    IRequestHandler<UpdateGrnCommand, GrnDto>,
    IRequestHandler<DeleteGrnCommand, Unit>
{
    private async Task<GoodsReceiptNote> Load(Guid companyId, Guid id, CancellationToken ct) =>
        await db.Grns.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId, ct)
        ?? throw new KeyNotFoundException("GRN not found.");

    public async Task<IReadOnlyList<GrnDto>> Handle(GetGrnsQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Grns.Include(x => x.Lines).Where(x => x.CompanyId == request.CompanyId)
            .OrderByDescending(x => x.GrnDate).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<GrnDto> Handle(GetGrnByIdQuery request, CancellationToken cancellationToken) =>
        (await Load(request.CompanyId, request.Id, cancellationToken)).ToDto();

    public async Task<GrnDto> Handle(CreateGrnCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var grn = new GoodsReceiptNote
        {
            CompanyId = r.CompanyId,
            GrnNo = string.IsNullOrWhiteSpace(r.GrnNo) ? StoreHandlerSupport.NextNumber("GRN") : r.GrnNo.Trim(),
            GrnDate = r.GrnDate,
            Supplier = r.Supplier.Trim(),
            PoReference = r.PoReference?.Trim(),
        };
        db.Add(grn);

        foreach (var line in r.Lines)
        {
            var amount = line.Quantity * line.Rate;
            grn.TotalAmount += amount;
            db.Add(new GrnLine
            {
                CompanyId = r.CompanyId,
                GrnId = grn.Id,
                ItemId = line.ItemId,
                ItemName = line.ItemName.Trim(),
                Quantity = line.Quantity,
                Rate = line.Rate,
            });

            if (line.ItemId.HasValue)
            {
                var item = await StoreHandlerSupport.LoadItem(db, r.CompanyId, line.ItemId.Value, cancellationToken);
                await StoreHandlerSupport.ApplyStockChange(
                    db, inventory, item, StoreTransactionTypes.In,
                    line.Quantity,
                    new StockMovementRequest(r.CompanyId, item.Id, line.Quantity, grn.GrnNo, null, null, r.Supplier, null),
                    cancellationToken);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return (await Load(r.CompanyId, grn.Id, cancellationToken)).ToDto();
    }

    public async Task<GrnDto> Handle(UpdateGrnCommand command, CancellationToken cancellationToken)
    {
        var grn = await Load(command.CompanyId, command.Id, cancellationToken);
        grn.Status = command.Request.Status.Trim();
        grn.PoReference = command.Request.PoReference?.Trim();
        grn.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return grn.ToDto();
    }

    public async Task<Unit> Handle(DeleteGrnCommand request, CancellationToken cancellationToken)
    {
        _ = await Load(request.CompanyId, request.Id, cancellationToken);
        throw new InvalidOperationException("GRN delete is not supported after stock has been posted.");
    }
}

// Stock
public sealed class StockHandlers(IStoreDbContext db, IInventorySyncClient inventory) :
    IRequestHandler<StockInCommand, StockTransactionDto>,
    IRequestHandler<StockOutCommand, StockTransactionDto>,
    IRequestHandler<GetTransactionsQuery, IReadOnlyList<StockTransactionDto>>,
    IRequestHandler<GetDashboardSummaryQuery, StockDashboardSummaryDto>,
    IRequestHandler<GetLowStockQuery, IReadOnlyList<StoreItemDto>>
{
    public async Task<StockTransactionDto> Handle(StockInCommand command, CancellationToken cancellationToken)
    {
        var item = await StoreHandlerSupport.LoadItem(db, command.Request.CompanyId, command.Request.ItemId, cancellationToken);
        await StoreHandlerSupport.ApplyStockChange(db, inventory, item, StoreTransactionTypes.In, command.Request.Quantity, command.Request, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        var txn = await db.Transactions.Include(x => x.Item)
            .Where(x => x.CompanyId == command.Request.CompanyId && x.ItemId == item.Id)
            .OrderByDescending(x => x.TransactionDate)
            .FirstAsync(cancellationToken);
        return txn.ToDto();
    }

    public async Task<StockTransactionDto> Handle(StockOutCommand command, CancellationToken cancellationToken)
    {
        var item = await StoreHandlerSupport.LoadItem(db, command.Request.CompanyId, command.Request.ItemId, cancellationToken);
        await StoreHandlerSupport.ApplyStockChange(db, inventory, item, StoreTransactionTypes.Out, command.Request.Quantity, command.Request, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        var txn = await db.Transactions.Include(x => x.Item)
            .Where(x => x.CompanyId == command.Request.CompanyId && x.ItemId == item.Id)
            .OrderByDescending(x => x.TransactionDate)
            .FirstAsync(cancellationToken);
        return txn.ToDto();
    }

    public async Task<IReadOnlyList<StockTransactionDto>> Handle(GetTransactionsQuery request, CancellationToken cancellationToken)
    {
        var q = db.Transactions.Include(x => x.Item).Where(x => x.CompanyId == request.CompanyId);
        if (request.ItemId.HasValue)
        {
            q = q.Where(x => x.ItemId == request.ItemId);
        }

        var list = await q.OrderByDescending(x => x.TransactionDate).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<StockDashboardSummaryDto> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var items = await db.Items.Where(x => x.CompanyId == request.CompanyId && x.IsActive).ToListAsync(cancellationToken);
        var lowStock = items.Count(x => x.CurrentStock <= x.MinimumStockLevel);
        var totalValue = items.Sum(x => x.CurrentStock * x.UnitPrice);
        var orders = await db.Orders.CountAsync(x => x.CompanyId == request.CompanyId, cancellationToken);
        var pendingBookings = await db.Bookings.CountAsync(
            x => x.CompanyId == request.CompanyId && x.Status != StoreBookingStatuses.Completed, cancellationToken);
        return new StockDashboardSummaryDto(totalValue, items.Count, lowStock, orders, pendingBookings);
    }

    public async Task<IReadOnlyList<StoreItemDto>> Handle(GetLowStockQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Items.Include(x => x.Category).Include(x => x.Unit)
            .Where(x => x.CompanyId == request.CompanyId && x.IsActive && x.CurrentStock <= x.MinimumStockLevel)
            .OrderBy(x => x.CurrentStock).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }
}

// Reports & ledger
public sealed class ReportHandlers(IStoreDbContext db) :
    IRequestHandler<GetShortageReportQuery, IReadOnlyList<StoreBookingDto>>,
    IRequestHandler<GetConsumptionReportQuery, IReadOnlyList<OrderConsumptionLineDto>>,
    IRequestHandler<GetItemStockReportQuery, IReadOnlyList<StoreItemDto>>,
    IRequestHandler<GetBookingVsIssueReportQuery, IReadOnlyList<BookingVsIssueLineDto>>,
    IRequestHandler<GetStockLedgerQuery, IReadOnlyList<StockLedgerEntryDto>>
{
    public async Task<IReadOnlyList<StoreBookingDto>> Handle(GetShortageReportQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Bookings.Include(x => x.Order).Include(x => x.Item).ThenInclude(i => i!.Unit)
            .Where(x => x.CompanyId == request.CompanyId && x.IssuedQty < x.BookedQuantity)
            .OrderBy(x => x.BookingDate).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<OrderConsumptionLineDto>> Handle(GetConsumptionReportQuery request, CancellationToken cancellationToken)
    {
        var bookings = await db.Bookings.Include(x => x.Order).Include(x => x.Item)
            .Where(x => x.CompanyId == request.CompanyId).ToListAsync(cancellationToken);
        return bookings
            .GroupBy(x => new { x.OrderId, OrderNumber = x.Order?.OrderNumber ?? string.Empty, x.ItemId, ItemName = x.Item?.ItemName ?? string.Empty })
            .Select(g => new OrderConsumptionLineDto(
                g.Key.OrderId, g.Key.OrderNumber, g.Key.ItemId, g.Key.ItemName,
                g.Sum(x => x.BookedQuantity), g.Sum(x => x.IssuedQty), g.Sum(x => x.IssuedQty)))
            .ToList();
    }

    public async Task<IReadOnlyList<StoreItemDto>> Handle(GetItemStockReportQuery request, CancellationToken cancellationToken)
    {
        var list = await db.Items.Include(x => x.Category).Include(x => x.Unit)
            .Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.ItemName).ToListAsync(cancellationToken);
        return list.Select(x => x.ToDto()).ToList();
    }

    public async Task<IReadOnlyList<BookingVsIssueLineDto>> Handle(GetBookingVsIssueReportQuery request, CancellationToken cancellationToken)
    {
        var q = db.Bookings.Include(x => x.Order).Include(x => x.Item).Where(x => x.CompanyId == request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.BookingType))
        {
            q = q.Where(x => x.BookingType == request.BookingType);
        }

        return await q.OrderByDescending(x => x.BookingDate)
            .Select(x => new BookingVsIssueLineDto(
                x.Id, x.BookingNumber, x.Order!.OrderNumber, x.Item!.ItemName,
                x.BookedQuantity, x.IssuedQty, x.BookedQuantity - x.IssuedQty))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StockLedgerEntryDto>> Handle(GetStockLedgerQuery request, CancellationToken cancellationToken)
    {
        var item = await db.Items.FirstOrDefaultAsync(x => x.Id == request.ItemId && x.CompanyId == request.CompanyId, cancellationToken)
            ?? throw new KeyNotFoundException("Item not found.");
        var txns = await db.Transactions
            .Where(x => x.CompanyId == request.CompanyId && x.ItemId == request.ItemId)
            .OrderBy(x => x.TransactionDate)
            .ThenBy(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var balance = item.OpeningStock;
        var rows = new List<StockLedgerEntryDto>();
        foreach (var t in txns)
        {
            var qtyIn = t.TransactionType == StoreTransactionTypes.In ? t.Quantity : 0;
            var qtyOut = t.TransactionType == StoreTransactionTypes.Out ? t.Quantity : 0;
            balance += qtyIn - qtyOut;
            rows.Add(new StockLedgerEntryDto(
                t.Id, t.TransactionNumber, t.TransactionDate, t.TransactionType,
                qtyIn, qtyOut, balance, t.ReferenceNumber));
        }

        return rows;
    }
}
