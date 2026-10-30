# ShipmentService

Finished-goods readiness, shipment execution, and reports. Port **5140**.

```powershell
dotnet run --project Services\ShipmentService\ShipmentService.API --urls http://0.0.0.0:5140
```

Gateway: `/api/v1/shipments/*`. Merchandising owns shipment **plan** CRUD.
