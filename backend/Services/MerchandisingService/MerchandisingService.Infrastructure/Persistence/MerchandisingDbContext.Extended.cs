using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Infrastructure.Persistence;

public sealed partial class MerchandisingDbContext
{
    public DbSet<ColorMaster> ColorMasters => Set<ColorMaster>();
    public DbSet<SizeMaster> SizeMasters => Set<SizeMaster>();
    public DbSet<SizeRatioTemplate> SizeRatioTemplates => Set<SizeRatioTemplate>();
    public DbSet<UnitMaster> UnitMasters => Set<UnitMaster>();
    public DbSet<CurrencyMaster> CurrencyMasters => Set<CurrencyMaster>();
    public DbSet<FabricTypeMaster> FabricTypeMasters => Set<FabricTypeMaster>();
    public DbSet<TrimsTypeMaster> TrimsTypeMasters => Set<TrimsTypeMaster>();
    public DbSet<SupplierMaster> SupplierMasters => Set<SupplierMaster>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<GarmentCategory> GarmentCategories => Set<GarmentCategory>();
    public DbSet<BuyerContact> BuyerContacts => Set<BuyerContact>();
    public DbSet<BuyerPaymentTerm> BuyerPaymentTerms => Set<BuyerPaymentTerm>();
    public DbSet<BuyerComplianceRule> BuyerComplianceRules => Set<BuyerComplianceRule>();
    public DbSet<StyleVersion> StyleVersions => Set<StyleVersion>();
    public DbSet<StyleBomItem> StyleBomItems => Set<StyleBomItem>();
    public DbSet<SampleCosting> SampleCostings => Set<SampleCosting>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationLine> QuotationLines => Set<QuotationLine>();
    public DbSet<QuotationNegotiation> QuotationNegotiations => Set<QuotationNegotiation>();
    public DbSet<OrderAssignment> OrderAssignments => Set<OrderAssignment>();
    public DbSet<OrderCommercialTerms> OrderCommercialTerms => Set<OrderCommercialTerms>();
    public DbSet<OrderTrimsMatrix> OrderTrimsMatrices => Set<OrderTrimsMatrix>();
    public DbSet<TnaTemplate> TnaTemplates => Set<TnaTemplate>();
    public DbSet<TnaCalendar> TnaCalendars => Set<TnaCalendar>();
    public DbSet<TnaMilestone> TnaMilestones => Set<TnaMilestone>();
    public DbSet<TnaDelayLog> TnaDelayLogs => Set<TnaDelayLog>();
    public DbSet<MaterialBooking> MaterialBookings => Set<MaterialBooking>();
    public DbSet<FabricBookingDetail> FabricBookingDetails => Set<FabricBookingDetail>();
    public DbSet<TrimsBookingDetail> TrimsBookingDetails => Set<TrimsBookingDetail>();
    public DbSet<BookingAllocation> BookingAllocations => Set<BookingAllocation>();
    public DbSet<PurchaseRequisition> PurchaseRequisitions => Set<PurchaseRequisition>();
    public DbSet<RequisitionLine> RequisitionLines => Set<RequisitionLine>();

    IQueryable<ColorMaster> IMerchandisingDbContext.ColorMasters => ColorMasters;
    IQueryable<SizeMaster> IMerchandisingDbContext.SizeMasters => SizeMasters;
    IQueryable<SizeRatioTemplate> IMerchandisingDbContext.SizeRatioTemplates => SizeRatioTemplates;
    IQueryable<UnitMaster> IMerchandisingDbContext.UnitMasters => UnitMasters;
    IQueryable<CurrencyMaster> IMerchandisingDbContext.CurrencyMasters => CurrencyMasters;
    IQueryable<FabricTypeMaster> IMerchandisingDbContext.FabricTypeMasters => FabricTypeMasters;
    IQueryable<TrimsTypeMaster> IMerchandisingDbContext.TrimsTypeMasters => TrimsTypeMasters;
    IQueryable<SupplierMaster> IMerchandisingDbContext.SupplierMasters => SupplierMasters;
    IQueryable<Brand> IMerchandisingDbContext.Brands => Brands;
    IQueryable<GarmentCategory> IMerchandisingDbContext.GarmentCategories => GarmentCategories;
    IQueryable<BuyerContact> IMerchandisingDbContext.BuyerContacts => BuyerContacts;
    IQueryable<BuyerPaymentTerm> IMerchandisingDbContext.BuyerPaymentTerms => BuyerPaymentTerms;
    IQueryable<BuyerComplianceRule> IMerchandisingDbContext.BuyerComplianceRules => BuyerComplianceRules;
    IQueryable<StyleVersion> IMerchandisingDbContext.StyleVersions => StyleVersions;
    IQueryable<StyleBomItem> IMerchandisingDbContext.StyleBomItems => StyleBomItems;
    IQueryable<SampleCosting> IMerchandisingDbContext.SampleCostings => SampleCostings;
    IQueryable<Quotation> IMerchandisingDbContext.Quotations => Quotations;
    IQueryable<QuotationLine> IMerchandisingDbContext.QuotationLines => QuotationLines;
    IQueryable<QuotationNegotiation> IMerchandisingDbContext.QuotationNegotiations => QuotationNegotiations;
    IQueryable<OrderAssignment> IMerchandisingDbContext.OrderAssignments => OrderAssignments;
    IQueryable<OrderCommercialTerms> IMerchandisingDbContext.OrderCommercialTerms => OrderCommercialTerms;
    IQueryable<OrderTrimsMatrix> IMerchandisingDbContext.OrderTrimsMatrices => OrderTrimsMatrices;
    IQueryable<TnaTemplate> IMerchandisingDbContext.TnaTemplates => TnaTemplates;
    IQueryable<TnaCalendar> IMerchandisingDbContext.TnaCalendars => TnaCalendars;
    IQueryable<TnaMilestone> IMerchandisingDbContext.TnaMilestones => TnaMilestones;
    IQueryable<TnaDelayLog> IMerchandisingDbContext.TnaDelayLogs => TnaDelayLogs;
    IQueryable<MaterialBooking> IMerchandisingDbContext.MaterialBookings => MaterialBookings;
    IQueryable<FabricBookingDetail> IMerchandisingDbContext.FabricBookingDetails => FabricBookingDetails;
    IQueryable<TrimsBookingDetail> IMerchandisingDbContext.TrimsBookingDetails => TrimsBookingDetails;
    IQueryable<BookingAllocation> IMerchandisingDbContext.BookingAllocations => BookingAllocations;
    IQueryable<PurchaseRequisition> IMerchandisingDbContext.PurchaseRequisitions => PurchaseRequisitions;
    IQueryable<RequisitionLine> IMerchandisingDbContext.RequisitionLines => RequisitionLines;

    partial void ConfigureExtendedEntities(ModelBuilder modelBuilder)
    {
        ConfigureAuditable<ColorMaster>(modelBuilder);
        ConfigureAuditable<SizeMaster>(modelBuilder);
        ConfigureAuditable<SizeRatioTemplate>(modelBuilder);
        ConfigureAuditable<UnitMaster>(modelBuilder);
        ConfigureAuditable<CurrencyMaster>(modelBuilder);
        ConfigureAuditable<FabricTypeMaster>(modelBuilder);
        ConfigureAuditable<TrimsTypeMaster>(modelBuilder);
        ConfigureAuditable<SupplierMaster>(modelBuilder);
        ConfigureAuditable<Brand>(modelBuilder);
        ConfigureAuditable<GarmentCategory>(modelBuilder);
        ConfigureAuditable<BuyerContact>(modelBuilder);
        ConfigureAuditable<BuyerPaymentTerm>(modelBuilder);
        ConfigureAuditable<BuyerComplianceRule>(modelBuilder);
        ConfigureAuditable<StyleVersion>(modelBuilder);
        ConfigureAuditable<StyleBomItem>(modelBuilder);
        ConfigureAuditable<SampleCosting>(modelBuilder);
        ConfigureAuditable<Quotation>(modelBuilder);
        ConfigureAuditable<QuotationLine>(modelBuilder);
        ConfigureAuditable<QuotationNegotiation>(modelBuilder);
        ConfigureAuditable<OrderAssignment>(modelBuilder);
        ConfigureAuditable<OrderCommercialTerms>(modelBuilder);
        ConfigureAuditable<OrderTrimsMatrix>(modelBuilder);
        ConfigureAuditable<TnaTemplate>(modelBuilder);
        ConfigureAuditable<TnaCalendar>(modelBuilder);
        ConfigureAuditable<TnaMilestone>(modelBuilder);
        ConfigureAuditable<TnaDelayLog>(modelBuilder);
        ConfigureAuditable<MaterialBooking>(modelBuilder);
        ConfigureAuditable<FabricBookingDetail>(modelBuilder);
        ConfigureAuditable<TrimsBookingDetail>(modelBuilder);
        ConfigureAuditable<BookingAllocation>(modelBuilder);
        ConfigureAuditable<PurchaseRequisition>(modelBuilder);
        ConfigureAuditable<RequisitionLine>(modelBuilder);

        modelBuilder.Entity<Buyer>(e =>
        {
            e.Property(x => x.PaymentTerms).HasMaxLength(200);
            e.Property(x => x.Currency).HasMaxLength(10);
        });

        modelBuilder.Entity<Style>(e =>
        {
            e.HasOne(x => x.Brand).WithMany().HasForeignKey(x => x.BrandId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ColorMaster>(e =>
        {
            e.ToTable("ColorMasters");
            e.Property(x => x.ColorCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.ColorName).HasMaxLength(150).IsRequired();
            e.Property(x => x.PantoneCode).HasMaxLength(50);
            e.HasIndex(x => new { x.CompanyId, x.ColorCode }).IsUnique();
        });

        modelBuilder.Entity<SizeMaster>(e =>
        {
            e.ToTable("SizeMasters");
            e.Property(x => x.SizeCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.SizeName).HasMaxLength(50).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.SizeCode }).IsUnique();
        });

        modelBuilder.Entity<SizeRatioTemplate>(e =>
        {
            e.ToTable("SizeRatioTemplates");
            e.Property(x => x.TemplateCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.TemplateName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.TemplateCode }).IsUnique();
        });

        modelBuilder.Entity<UnitMaster>(e =>
        {
            e.ToTable("UnitMasters");
            e.Property(x => x.UnitCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.UnitName).HasMaxLength(100).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.UnitCode }).IsUnique();
        });

        modelBuilder.Entity<CurrencyMaster>(e =>
        {
            e.ToTable("CurrencyMasters");
            e.Property(x => x.CurrencyCode).HasMaxLength(10).IsRequired();
            e.Property(x => x.CurrencyName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Symbol).HasMaxLength(10);
            e.HasIndex(x => new { x.CompanyId, x.CurrencyCode }).IsUnique();
        });

        modelBuilder.Entity<FabricTypeMaster>(e =>
        {
            e.ToTable("FabricTypeMasters");
            e.Property(x => x.FabricTypeCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.FabricTypeName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.FabricTypeCode }).IsUnique();
        });

        modelBuilder.Entity<TrimsTypeMaster>(e =>
        {
            e.ToTable("TrimsTypeMasters");
            e.Property(x => x.TrimsTypeCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.TrimsTypeName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.TrimsTypeCode }).IsUnique();
        });

        modelBuilder.Entity<SupplierMaster>(e =>
        {
            e.ToTable("SupplierMasters");
            e.Property(x => x.SupplierCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.SupplierName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.SupplierCode }).IsUnique();
        });

        modelBuilder.Entity<Brand>(e =>
        {
            e.ToTable("Brands");
            e.Property(x => x.BrandCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.BrandName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.BrandCode }).IsUnique();
            e.HasOne(x => x.Buyer).WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GarmentCategory>(e =>
        {
            e.ToTable("GarmentCategories");
            e.Property(x => x.CategoryCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.CategoryName).HasMaxLength(150).IsRequired();
            e.HasIndex(x => new { x.CompanyId, x.CategoryCode }).IsUnique();
        });

        modelBuilder.Entity<BuyerContact>(e =>
        {
            e.ToTable("BuyerContacts");
            e.Property(x => x.Name).HasMaxLength(150).IsRequired();
            e.HasOne(x => x.Buyer).WithMany(x => x.Contacts).HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BuyerPaymentTerm>(e =>
        {
            e.ToTable("BuyerPaymentTerms");
            e.Property(x => x.TermName).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.Buyer).WithMany(x => x.PaymentTermDetails).HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BuyerComplianceRule>(e =>
        {
            e.ToTable("BuyerComplianceRules");
            e.Property(x => x.RuleName).HasMaxLength(150).IsRequired();
            e.Property(x => x.RuleType).HasMaxLength(50).IsRequired();
            e.HasOne(x => x.Buyer).WithMany(x => x.ComplianceRules).HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StyleVersion>(e =>
        {
            e.ToTable("StyleVersions");
            e.HasIndex(x => new { x.StyleId, x.VersionNo }).IsUnique();
            e.HasOne(x => x.Style).WithMany(x => x.Versions).HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StyleBomItem>(e =>
        {
            e.ToTable("StyleBomItems");
            e.Property(x => x.ItemType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Consumption).HasPrecision(18, 4);
            e.Property(x => x.WastagePercent).HasPrecision(18, 2);
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.HasOne(x => x.Style).WithMany(x => x.BomItems).HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SampleCosting>(e =>
        {
            e.ToTable("SampleCostings");
            e.HasIndex(x => x.SampleId).IsUnique();
            e.Property(x => x.FabricCost).HasPrecision(18, 4);
            e.Property(x => x.TrimsCost).HasPrecision(18, 4);
            e.Property(x => x.CMCost).HasPrecision(18, 4);
            e.Property(x => x.TotalCost).HasPrecision(18, 4);
            e.HasOne(x => x.Sample).WithOne(x => x.Costing).HasForeignKey<SampleCosting>(x => x.SampleId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Quotation>(e =>
        {
            e.ToTable("Quotations");
            e.Property(x => x.QuotationNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(QuotationStatuses.Draft);
            e.Property(x => x.TotalAmount).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.QuotationNo }).IsUnique();
            e.HasOne(x => x.Buyer).WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Style).WithMany().HasForeignKey(x => x.StyleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<QuotationLine>(e =>
        {
            e.ToTable("QuotationLines");
            e.Property(x => x.UnitPrice).HasPrecision(18, 4);
            e.Property(x => x.LineTotal).HasPrecision(18, 4);
            e.HasOne(x => x.Quotation).WithMany(x => x.Lines).HasForeignKey(x => x.QuotationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuotationNegotiation>(e =>
        {
            e.ToTable("QuotationNegotiations");
            e.Property(x => x.ProposedAmount).HasPrecision(18, 4);
            e.Property(x => x.CounterAmount).HasPrecision(18, 4);
            e.HasOne(x => x.Quotation).WithMany(x => x.Negotiations).HasForeignKey(x => x.QuotationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderAssignment>(e =>
        {
            e.ToTable("OrderAssignments");
            e.HasIndex(x => x.OrderId).IsUnique();
            e.HasOne(x => x.Order).WithOne(x => x.Assignment).HasForeignKey<OrderAssignment>(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderCommercialTerms>(e =>
        {
            e.ToTable("OrderCommercialTerms");
            e.HasIndex(x => x.OrderId).IsUnique();
            e.Property(x => x.Commission).HasPrecision(18, 4);
            e.HasOne(x => x.Order).WithOne(x => x.CommercialTerms).HasForeignKey<OrderCommercialTerms>(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderTrimsMatrix>(e =>
        {
            e.ToTable("OrderTrimsMatrices");
            e.HasOne(x => x.Order).WithMany(x => x.TrimsMatrix).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderCosting>(e =>
        {
            e.Property(x => x.FreightCost).HasPrecision(18, 4);
            e.Property(x => x.CommercialCost).HasPrecision(18, 4);
            e.Property(x => x.BankCharges).HasPrecision(18, 4);
            e.Property(x => x.Commission).HasPrecision(18, 4);
            e.Property(x => x.FinalFob).HasPrecision(18, 4);
        });

        modelBuilder.Entity<TnaTemplate>(e =>
        {
            e.ToTable("TnaTemplates");
            e.Property(x => x.TemplateName).HasMaxLength(150).IsRequired();
        });

        modelBuilder.Entity<TnaCalendar>(e =>
        {
            e.ToTable("TnaCalendars");
            e.HasIndex(x => x.OrderId).IsUnique();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(TnaCalendarStatuses.Active);
            e.HasOne(x => x.Order).WithOne(x => x.TnaCalendar).HasForeignKey<TnaCalendar>(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Template).WithMany().HasForeignKey(x => x.TemplateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TnaMilestone>(e =>
        {
            e.ToTable("TnaMilestones");
            e.Property(x => x.MilestoneName).HasMaxLength(150).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(TnaMilestoneStatuses.Pending);
            e.HasOne(x => x.Calendar).WithMany(x => x.Milestones).HasForeignKey(x => x.TnaCalendarId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Template).WithMany(x => x.Milestones).HasForeignKey(x => x.TnaTemplateId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TnaDelayLog>(e =>
        {
            e.ToTable("TnaDelayLogs");
            e.Property(x => x.Reason).HasMaxLength(500).IsRequired();
            e.HasOne(x => x.Milestone).WithMany(x => x.DelayLogs).HasForeignKey(x => x.TnaMilestoneId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MaterialBooking>(e =>
        {
            e.ToTable("MaterialBookings");
            e.Property(x => x.BookingNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.BookingType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(BookingStatuses.Draft);
            e.Property(x => x.TotalQty).HasPrecision(18, 4);
            e.HasIndex(x => new { x.CompanyId, x.BookingNo }).IsUnique();
            e.HasOne(x => x.Order).WithMany(x => x.MaterialBookings).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FabricBookingDetail>(e =>
        {
            e.ToTable("FabricBookingDetails");
            e.Property(x => x.RequiredQty).HasPrecision(18, 4);
            e.Property(x => x.BookedQty).HasPrecision(18, 4);
            e.HasOne(x => x.MaterialBooking).WithMany(x => x.FabricDetails).HasForeignKey(x => x.MaterialBookingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TrimsBookingDetail>(e =>
        {
            e.ToTable("TrimsBookingDetails");
            e.Property(x => x.RequiredQty).HasPrecision(18, 4);
            e.Property(x => x.BookedQty).HasPrecision(18, 4);
            e.HasOne(x => x.MaterialBooking).WithMany(x => x.TrimsDetails).HasForeignKey(x => x.MaterialBookingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BookingAllocation>(e =>
        {
            e.ToTable("BookingAllocations");
            e.Property(x => x.AllocatedQty).HasPrecision(18, 4);
            e.HasOne(x => x.MaterialBooking).WithMany(x => x.Allocations).HasForeignKey(x => x.MaterialBookingId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PurchaseRequisition>(e =>
        {
            e.ToTable("PurchaseRequisitions");
            e.Property(x => x.RequisitionNo).HasMaxLength(100).IsRequired();
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(RequisitionStatuses.Draft);
            e.HasIndex(x => new { x.CompanyId, x.RequisitionNo }).IsUnique();
            e.HasOne(x => x.Order).WithMany(x => x.Requisitions).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RequisitionLine>(e =>
        {
            e.ToTable("RequisitionLines");
            e.Property(x => x.RequiredQty).HasPrecision(18, 4);
            e.Property(x => x.Status).HasMaxLength(50).HasDefaultValue(RequisitionLineStatuses.Open);
            e.HasOne(x => x.Requisition).WithMany(x => x.Lines).HasForeignKey(x => x.RequisitionId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
