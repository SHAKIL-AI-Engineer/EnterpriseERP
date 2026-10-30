using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/categories")]
public sealed class CategoriesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ItemCategoryDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ItemCategoryDto>>.Ok(await mediator.Send(new GetCategoriesQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ItemCategoryDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ItemCategoryDto>.Ok(await mediator.Send(new GetCategoryByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ItemCategoryDto>>> Create(CreateItemCategoryRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ItemCategoryDto>.Ok(await mediator.Send(new CreateCategoryCommand(request), cancellationToken), "Category created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ItemCategoryDto>>> Update(Guid id, UpdateItemCategoryRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ItemCategoryDto>.Ok(await mediator.Send(new UpdateCategoryCommand(id, request), cancellationToken), "Category updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteCategoryCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Category deleted."));
    }
}
