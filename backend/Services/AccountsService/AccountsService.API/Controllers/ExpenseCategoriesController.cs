using AccountsService.Contracts;
using AccountsService.Infrastructure.Persistence;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AccountsService.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/expense-categories")]
public sealed class ExpenseCategoriesController(AccountsDbContext db) : ControllerBase
{
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExpenseCategoryDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct)
    {
        var items = await db.ExpenseCategories
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && !x.IsDeleted)
            .OrderBy(x => x.CategoryCode)
            .Select(x => new ExpenseCategoryDto(x.Id, x.CompanyId, x.CategoryCode, x.CategoryName, x.ExpenseAccountId))
            .ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<ExpenseCategoryDto>>.Ok(items));
    }
}
