const { z } = require('zod');

const rawRowSchema = z.object({
  service_id: z.string().trim().min(1, 'service_id is required'),
  service_name: z.string().trim().optional(),
  timestamp: z.string().trim().min(1, 'timestamp is required'),
  status_code: z.union([z.string(), z.number()]).transform(val => String(val).trim()),
  latency: z.union([z.string(), z.number(), z.null(), z.undefined()]).transform(val => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  }),
  latency_unit: z.string().trim().default('ms'),
  agent: z.string().trim().min(1, 'agent is required'),
  region: z.string().trim().min(1, 'region is required')
});

function validateRawRow(row) {
  return rawRowSchema.safeParse(row);
}

module.exports = {
  rawRowSchema,
  validateRawRow
};
