import type { SrmField } from './SrmFormModal';
import type { SupplierUpdatePayload } from '../api/srmApi';
import type { SupplierType, SupplierCategory } from '@/types/srm';

/** Поля формы контрагента (поставщик/заказчик) — общие для страниц «Поставщики» и «Договоры». */
export const SUPPLIER_FIELDS: SrmField[] = [
  { key: 'name', label: 'Название', required: true, placeholder: 'ООО «СтройМонтаж»' },
  { key: 'inn', label: 'ИНН', required: true, placeholder: '7701234567' },
  { key: 'kpp', label: 'КПП' },
  { key: 'ogrn', label: 'ОГРН' },
  {
    key: 'type', label: 'Тип', type: 'select', required: true,
    options: [
      { value: 'manufacturer', label: 'Производитель' },
      { value: 'distributor', label: 'Дистрибьютор' },
      { value: 'contractor', label: 'Подрядчик' },
      { value: 'service_provider', label: 'Поставщик услуг' },
      { value: 'customer', label: 'Заказчик' },
    ],
  },
  {
    key: 'category', label: 'Категория', type: 'select', required: true,
    options: [
      { value: 'materials', label: 'Материалы' },
      { value: 'equipment', label: 'Оборудование' },
      { value: 'services', label: 'Услуги' },
      { value: 'subcontractors', label: 'Субподрядчики' },
      { value: 'supply', label: 'Поставка' },
    ],
  },
  { key: 'contact_name', label: 'Контактное лицо', required: true },
  { key: 'contact_phone', label: 'Телефон', required: true, placeholder: '+7 (___) ___-__-__' },
  { key: 'contact_email', label: 'Email', type: 'email', required: true },
  { key: 'website', label: 'Сайт', placeholder: 'https://' },
  { key: 'address', label: 'Адрес', required: true, fullWidth: true },
];

export function buildSupplierPayload(values: Record<string, string>): SupplierUpdatePayload {
  return {
    name: values.name.trim(),
    inn: values.inn.trim(),
    type: values.type as SupplierType,
    category: values.category as SupplierCategory,
    contact_name: values.contact_name.trim(),
    contact_email: values.contact_email.trim(),
    contact_phone: values.contact_phone.trim(),
    address: values.address.trim(),
    kpp: values.kpp?.trim() ?? '',
    ogrn: values.ogrn?.trim() ?? '',
    website: values.website?.trim() ?? '',
  };
}
