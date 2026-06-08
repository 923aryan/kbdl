'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateShiftSwap, useGetReferredEmployee } from '../hooks/use-shift-hook';
import { useShiftStore } from '../stores/use-shift-store';

const formSchema = z.object({
  original_employee_phone: z
    .string()
    .min(10, 'Worker phone number is required')
    .max(15, 'Phone number is too long')
    .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
  replacement_employee_phone: z
    .string()
    .max(15, 'Phone number is too long')
    .regex(/^\+?[0-9]*$/, "Phone number can only contain numbers and an optional leading '+'")
    .optional(),
  payType: z.enum(['HOURLY', 'FIXED']),
  shift_pay: z.coerce.number().positive('Shift Pay must be greater than 0'),
  shift_date: z.string().min(1, 'Shift Date is required'),
  shift_start: z.string().min(1, 'Shift Start is required'),
  shift_end: z.string().min(1, 'Shift End is required'),
  skill_required: z.string().min(1, 'Skill required cannot be empty').max(255),
});

type FormData = z.input<typeof formSchema>;

const SKILLS = [
  'WELDER',
  'FITTER',
  'ELECTRICIAN',
  'PLUMBER',
  'CARPENTER',
  'PAINTER',
  'MASON',
  'HELPER',
];

const getPhoneVariants = (phone: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return [];

  const withoutCountryCode = trimmed.startsWith('+91') ? trimmed.slice(3) : trimmed;
  const withCountryCode = trimmed.startsWith('+') ? trimmed : `+91${trimmed}`;

  return Array.from(new Set([trimmed, withCountryCode, withoutCountryCode]));
};

const buildDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}`).toISOString();
};

export const CreateShiftModal = () => {
  const { isCreateModalOpen, toggleCreateModal } = useShiftStore();
  const { mutate: createShift, isPending: isCreating } = useCreateShiftSwap();
  const { mutateAsync: getReferredEmployee, isPending: isFindingEmployee } = useGetReferredEmployee();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      original_employee_phone: '',
      replacement_employee_phone: '',
      skill_required: '',
      payType: 'FIXED',
      shift_pay: undefined,
      shift_date: '',
      shift_start: '',
      shift_end: '',
    },
  });

  const handleClose = () => {
    reset();
    toggleCreateModal();
  };

  const findEmployeeByPhone = async (phone: string) => {
    const variants = getPhoneVariants(phone);
    let lastError: unknown;

    for (const phone_no of variants) {
      try {
        return await getReferredEmployee({ phone_no });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  const onSubmit = async (data: FormData) => {
    try {
      const originalEmployee = await findEmployeeByPhone(data.original_employee_phone);

      let replacementEmployeeId: string | undefined;
      const replacementPhone = data.replacement_employee_phone?.trim();

      if (replacementPhone) {
        const replacementEmployee = await findEmployeeByPhone(replacementPhone);
        replacementEmployeeId = replacementEmployee.id;
      }

      createShift(
        {
          original_employee_id: originalEmployee.id,
          replacement_employee_id: replacementEmployeeId,
          payType: data.payType,
          shift_pay: Number(data.shift_pay),
          skill_required: data.skill_required,
          shift_date: buildDateTime(data.shift_date, '00:00'),
          shift_start: buildDateTime(data.shift_date, data.shift_start),
          shift_end: buildDateTime(data.shift_date, data.shift_end),
        },
        {
          onSuccess: () => {
            toast.success('Shift swap created successfully');
            handleClose();
          },
          onError: (error: any) => {
            toast.error(error?.message || 'Failed to create shift swap');
          },
        },
      );
    } catch (error: any) {
      toast.error(
        error?.message ||
          'Employee not found. Check that this worker is registered and the phone number matches.',
      );
    }
  };

  if (!isCreateModalOpen) return null;

  const isSubmitting = isCreating || isFindingEmployee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Create Shift Swap</h2>
            <button onClick={handleClose} className="rounded-lg p-1 transition hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
            <Controller
              control={control}
              name="original_employee_phone"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Worker Mobile Number *"
                  placeholder="9876543210"
                  error={errors.original_employee_phone?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="replacement_employee_phone"
              render={({ field }) => (
                <Input
                  {...field}
                  label="Replacement Mobile Number"
                  placeholder="Optional"
                  error={errors.replacement_employee_phone?.message}
                />
              )}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Controller
                control={control}
                name="skill_required"
                render={({ field }) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Skill *</label>
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select skill</option>
                      {SKILLS.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                    {errors.skill_required?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.skill_required.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="shift_pay"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    label="Shift Pay *"
                    placeholder="800"
                    error={errors.shift_pay?.message}
                    value={field.value === undefined ? '' : Number(field.value)}
                    onChange={(event) => field.onChange(Number(event.target.value))}
                  />
                )}
              />

              <Controller
                control={control}
                name="payType"
                render={({ field }) => (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Pay Type *
                    </label>
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="HOURLY">Hourly</option>
                    </select>
                    {errors.payType?.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.payType.message}</p>
                    )}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="shift_date"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="date"
                    label="Shift Date *"
                    error={errors.shift_date?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="shift_start"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Start Time *"
                    error={errors.shift_start?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="shift_end"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="End Time *"
                    error={errors.shift_end?.message}
                  />
                )}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Shift Swap'}
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
