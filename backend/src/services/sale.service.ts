import { SaleRepository } from '../repositories/sale.repository';
import { PhoneRepository } from '../repositories/phone.repository';
import { Sale, SaleInsert, SaleUpdate, SaleWithRelations } from '../entities/sale.entity';
import { PhoneStatus } from '../enums';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SaleResponseDto,
  SaleListResponseDto,
  SaleFilterDto,
  SaleSummaryDto,
  MarkAsSoldDto
} from '../dto/sale.dto';

/**
 * Sale Service
 * Business logic for Sale entity
 * Owner Module: M-07 Sales
 */
export class SaleService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly phoneRepository: PhoneRepository
  ) {}

  async findAll(filter?: SaleFilterDto): Promise<SaleListResponseDto> {
    const sales = await this.saleRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const total = await this.saleRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    return {
      data: sales.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<SaleResponseDto | null> {
    const sale = await this.saleRepository.findById(id);
    return sale ? this.toResponseDto(sale) : null;
  }

  async create(dto: CreateSaleDto): Promise<SaleResponseDto> {
    const phone = await this.phoneRepository.findById(dto.phoneId);
    if (!phone) {
      throw new Error(`Phone with id "${dto.phoneId}" not found`);
    }

    if (phone.status === PhoneStatus.SOLD) {
      throw new Error('Phone has already been sold');
    }

    const existingSale = await this.saleRepository.findByPhoneId(dto.phoneId);
    if (existingSale) {
      throw new Error('A sale record already exists for this phone');
    }

    const saleInsert: SaleInsert = {
      phone_id: dto.phoneId,
      sale_date: dto.saleDate,
      sale_price: dto.salePrice,
      cost_price: phone.cost_price,
      buyer_name: dto.buyerName?.trim() || null,
      buyer_phone: dto.buyerPhone?.trim() || null,
      buyer_email: dto.buyerEmail?.trim() || null,
      notes: dto.notes?.trim() || null
    };

    const sale = await this.saleRepository.create(saleInsert);
    await this.phoneRepository.update(dto.phoneId, { status: PhoneStatus.SOLD });

    const saleWithRelations = await this.saleRepository.findById(sale.id);
    return this.toResponseDto(saleWithRelations!);
  }

  async markAsSold(dto: MarkAsSoldDto): Promise<SaleResponseDto> {
    const phone = await this.phoneRepository.findById(dto.phoneId);
    if (!phone) {
      throw new Error(`Phone with id "${dto.phoneId}" not found`);
    }

    if (phone.status === PhoneStatus.SOLD) {
      throw new Error('Phone has already been sold');
    }

    const existingSale = await this.saleRepository.findByPhoneId(dto.phoneId);
    if (existingSale) {
      throw new Error('A sale record already exists for this phone');
    }

    const saleInsert: SaleInsert = {
      phone_id: dto.phoneId,
      sale_date: dto.saleDate,
      sale_price: dto.salePrice,
      cost_price: phone.cost_price,
      buyer_name: dto.buyerName?.trim() || null,
      buyer_phone: dto.buyerPhone?.trim() || null,
      buyer_email: dto.buyerEmail?.trim() || null,
      notes: dto.notes?.trim() || null
    };

    const sale = await this.saleRepository.create(saleInsert);
    await this.phoneRepository.update(dto.phoneId, { status: PhoneStatus.SOLD });

    const saleWithRelations = await this.saleRepository.findById(sale.id);
    return this.toResponseDto(saleWithRelations!);
  }

  async update(id: string, dto: UpdateSaleDto): Promise<SaleResponseDto> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) {
      throw new Error(`Sale with id "${id}" not found`);
    }

    const saleUpdate: SaleUpdate = {
      ...(dto.saleDate && { sale_date: dto.saleDate }),
      ...(dto.salePrice !== undefined && { sale_price: dto.salePrice }),
      ...(dto.buyerName !== undefined && { buyer_name: dto.buyerName?.trim() || null }),
      ...(dto.buyerPhone !== undefined && { buyer_phone: dto.buyerPhone?.trim() || null }),
      ...(dto.buyerEmail !== undefined && { buyer_email: dto.buyerEmail?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.saleRepository.update(id, saleUpdate);
    const saleWithRelations = await this.saleRepository.findById(id);
    return this.toResponseDto(saleWithRelations!);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) {
      throw new Error(`Sale with id "${id}" not found`);
    }

    await this.saleRepository.delete(id);
    await this.phoneRepository.update(existing.phone_id, { status: PhoneStatus.AVAILABLE });
  }

  async getSummary(filter?: SaleFilterDto): Promise<SaleSummaryDto> {
    const totalSales = await this.saleRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalRevenue = await this.saleRepository.getTotalRevenue({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalProfit = await this.saleRepository.getTotalProfit({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalCost = totalRevenue - totalProfit;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin
    };
  }

  async getSalesByMonth(year: number): Promise<{ month: number; count: number; revenue: number }[]> {
    return this.saleRepository.getSalesByMonth(year);
  }

  private toResponseDto(sale: SaleWithRelations): SaleResponseDto {
    return {
      id: sale.id,
      phoneId: sale.phone_id,
      brandName: sale.phone?.brand?.name || '',
      phoneName: sale.phone?.model || '',
      saleDate: sale.sale_date,
      salePrice: sale.sale_price,
      costPrice: sale.cost_price,
      profit: sale.sale_price - sale.cost_price,
      buyerName: sale.buyer_name,
      buyerPhone: sale.buyer_phone,
      buyerEmail: sale.buyer_email,
      notes: sale.notes,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at
    };
  }
}
