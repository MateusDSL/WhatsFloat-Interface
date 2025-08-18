import { z } from 'zod';

// Schema para validação de datas (formato YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Data deve estar no formato YYYY-MM-DD'
}).refine((date) => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}, {
  message: 'Data inválida'
});

// Schema para validação de customer ID
const customerIdSchema = z.string().optional().refine((id) => {
  if (!id) return true; // customerId é opcional
  return /^\d{10,11}$/.test(id); // Google Ads customer IDs têm 10-11 dígitos
}, {
  message: 'Customer ID deve ter 10-11 dígitos numéricos'
});

// Schema para validação de parâmetros de data
export const dateRangeSchema = z.object({
  dateFrom: dateSchema,
  dateTo: dateSchema,
}).refine((data) => {
  const fromDate = new Date(data.dateFrom);
  const toDate = new Date(data.dateTo);
  return fromDate <= toDate;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de query do Google Ads
export const googleAdsQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.enum(['campaigns', 'ads', 'keywords', 'chart-data', 'demographics', 'devices', 'location']).optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de query customizada
export const customQuerySchema = z.object({
  query: z.string().min(1, 'Query é obrigatória'),
  customerId: customerIdSchema,
});

// Schema para validação de parâmetros de campanhas
export const campaignsQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.enum(['campaigns', 'ads', 'keywords']).optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de dados de gráfico
export const chartDataQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.literal('chart-data').optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de demografia
export const demographicsQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.literal('demographics').optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de dispositivos
export const devicesQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.literal('devices').optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de localização
export const locationQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.literal('location').optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});

// Schema para validação de parâmetros de palavras-chave
export const keywordsQuerySchema = z.object({
  customerId: customerIdSchema,
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  type: z.literal('keywords').optional(),
}).refine((data) => {
  // Se dateFrom está presente, dateTo também deve estar
  if (data.dateFrom && !data.dateTo) {
    return false;
  }
  // Se dateTo está presente, dateFrom também deve estar
  if (data.dateTo && !data.dateFrom) {
    return false;
  }
  return true;
}, {
  message: 'Ambas as datas (dateFrom e dateTo) devem ser fornecidas juntas',
  path: ['dateFrom']
}).refine((data) => {
  // Se ambas as datas estão presentes, validar o intervalo
  if (data.dateFrom && data.dateTo) {
    const fromDate = new Date(data.dateFrom);
    const toDate = new Date(data.dateTo);
    return fromDate <= toDate;
  }
  return true;
}, {
  message: 'Data inicial deve ser menor ou igual à data final',
  path: ['dateTo']
});





// Função helper para validar parâmetros de URL
export function validateUrlParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params = Object.fromEntries(searchParams.entries());
  return schema.parse(params);
}

// Função helper para validar body de requisição
export function validateRequestBody<T extends z.ZodType>(
  schema: T,
  body: any
): z.infer<T> {
  return schema.parse(body);
}

// Função helper para formatar erros de validação
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}
