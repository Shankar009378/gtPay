// This Zod schema is used in the `route.ts` file to validate the data before saving it to the database.
import { z } from 'zod';

// Define Zod schema
const bankSchema = z.object({
  beneficiaryName: z.string().nonempty("Beneficiary name is required"),
  accountNo: z.string().nonempty("Account number is required"), // Assuming account number as string
  IFSCcode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bankName: z.string().nonempty("Bank name is required"),
  dailyLimit: z.string().nonempty("Daily limit must be a positive number"),
  activeDays: z.array(z.string()),
  activeMonths: z.array(z.string()),
  isActive: z.boolean().default(true),
});

export type BankDetailsType = z.infer<typeof bankSchema>;

// Export Zod schema
export { bankSchema };
