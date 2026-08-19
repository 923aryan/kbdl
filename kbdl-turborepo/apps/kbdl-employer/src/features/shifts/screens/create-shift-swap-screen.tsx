'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { createShiftSchema, getReferredEmployeeSchema } from '@repo/validator/shared';
import { Globe, Lock, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateShiftSwap, useGetReferredEmployee } from '../hooks/use-shift-hook';
import { useShiftStore } from '../stores/use-shift-store';

const referredEmployeePhoneSchema = getReferredEmployeeSchema.shape.body.shape.phone_no;

const formSchema = createShiftSchema.shape.body;

type FormData = z.input<typeof formSchema>;

const buildDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}`).toISOString();
};

const padTimeUnit = (value: number) => value.toString().padStart(2, '0');

const toDateInputValue = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${date.getFullYear()}-${padTimeUnit(date.getMonth() + 1)}-${padTimeUnit(date.getDate())}`;
};

const toTimeInputValue = (value?: string) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return `${padTimeUnit(date.getHours())}:${padTimeUnit(date.getMinutes())}`;
};

export const CreateShiftModal = () => {
  const { isCreateModalOpen, toggleCreateModal } = useShiftStore();
  const { mutate: createShift, isPending: isCreating } = useCreateShiftSwap();
  const { mutateAsync: getReferredEmployee, isPending: isFindingEmployee } = useGetReferredEmployee();
  const [shiftType, setShiftType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

  const [originalPhone, setOriginalPhone] = useState('');
  const [replacementPhone, setReplacementPhone] = useState('');
  const [phoneErrors, setPhoneErrors] = useState<{ original_employee_phone?: string; replacement_employee_phone?: string }>({});

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skill_required: '',
      payType: 'FIXED',
      shift_pay: undefined,
      shift_date: '',
      shift_start: '',
      shift_end: '',
    },
  });

  const shiftDateValue = watch('shift_date');
  const shiftStartValue = watch('shift_start');
  const shiftEndValue = watch('shift_end');

  const handleClose = () => {
    reset();
    setOriginalPhone('');
    setReplacementPhone('');
    setPhoneErrors({});
    toggleCreateModal();
  };

  const findEmployeeByPhone = async (phone: string) => {
    return getReferredEmployee({ phone_no: phone });
  };

  const onSubmit = async (data: FormData) => {
    try {
      let originalEmployeeId: string | undefined;
      let replacementEmployeeId: string | undefined;

      const origValidation = referredEmployeePhoneSchema.safeParse(originalPhone);
      if (!origValidation.success) {
        setPhoneErrors((prev) => ({ ...prev, original_employee_phone: origValidation.error.issues[0]?.message || 'Invalid phone number' }));
        return;
      }
      const originalEmployee = await findEmployeeByPhone(origValidation.data);
      originalEmployeeId = originalEmployee.id;

      if (shiftType === 'PRIVATE') {
        const repPhone = replacementPhone.trim();
        if (repPhone) {
          const repValidation = referredEmployeePhoneSchema.safeParse(repPhone);
          if (!repValidation.success) {
            setPhoneErrors((prev) => ({ ...prev, replacement_employee_phone: repValidation.error.issues[0]?.message || 'Invalid phone number' }));
            return;
          }
          const replacementEmployee = await findEmployeeByPhone(repValidation.data);
          replacementEmployeeId = replacementEmployee.id;
        }
      }

      createShift(
        {
          original_employee_id: originalEmployeeId,
          replacement_employee_id: replacementEmployeeId,
          payType: data.payType,
          shift_pay: Number(data.shift_pay),
          skill_required: data.skill_required,
          shift_date: data.shift_date,
          shift_start: data.shift_start,
          shift_end: data.shift_end,
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

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
            {/* <div className="h-px bg-gray-100" /> */}

            {/* Job Details */}
            <div className="space-y-4">
              {/* <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Job Requirement</h3>
              </div> */}
              <div className="grid gap-4 md:grid-cols-2">
                <Controller
                  control={control}
                  name="skill_required"
                  render={({ field }) => (
                    <div>
                      <Input
                        {...field}
                        label="Skill / Role *"
                        placeholder="Type or select a skill"
                        error={errors.skill_required?.message}
                      />
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Controller
                    control={control}
                    name="shift_pay"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        label="Amount *"
                        placeholder="e.g. 800"
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
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Pay Type *</label>

                        <div className="flex h-[50px] w-full rounded-xl border border-gray-300 bg-white p-1">
                          <button
                            type="button"
                            onClick={() => field.onChange('FIXED')}
                            className={`flex-1 rounded-lg text-base font-medium ${
                              field.value === 'FIXED' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                            }`}
                          >
                            Fixed
                          </button>

                          <button
                            type="button"
                            onClick={() => field.onChange('HOURLY')}
                            className={`flex-1 rounded-lg text-base font-medium ${
                              field.value === 'HOURLY'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-500'
                            }`}
                          >
                            Hourly
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              {/* <div className="mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Schedule Details</h3>
              </div> */}
              <div className="grid gap-4 md:grid-cols-3">
                <Controller
                  control={control}
                  name="shift_date"
                  render={({ field }) => {
                    const dateValue = toDateInputValue(field.value);

                    return (
                      <Input
                        name={field.name}
                        ref={field.ref}
                        type="date"
                        label="Date *"
                        value={dateValue}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          const selectedDate = event.target.value;

                          field.onChange(selectedDate ? buildDateTime(selectedDate, '00:00') : '');

                          if (!selectedDate) return;

                          const startTime = toTimeInputValue(shiftStartValue);
                          const endTime = toTimeInputValue(shiftEndValue);

                          if (startTime) {
                            setValue('shift_start', buildDateTime(selectedDate, startTime), {
                              shouldValidate: true,
                            });
                          }

                          if (endTime) {
                            setValue('shift_end', buildDateTime(selectedDate, endTime), {
                              shouldValidate: true,
                            });
                          }
                        }}
                        error={errors.shift_date?.message}
                      />
                    );
                  }}
                />
                <Controller
                  control={control}
                  name="shift_start"
                  render={({ field }) => (
                    <Input
                      name={field.name}
                      ref={field.ref}
                      type="time"
                      label="Start Time *"
                      value={toTimeInputValue(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const selectedTime = event.target.value;
                        const selectedDate = toDateInputValue(shiftDateValue);

                        field.onChange(
                          selectedDate && selectedTime
                            ? buildDateTime(selectedDate, selectedTime)
                            : '',
                        );
                      }}
                      error={errors.shift_start?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="shift_end"
                  render={({ field }) => (
                    <Input
                      name={field.name}
                      ref={field.ref}
                      type="time"
                      label="End Time *"
                      value={toTimeInputValue(field.value)}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const selectedTime = event.target.value;
                        const selectedDate = toDateInputValue(shiftDateValue);

                        field.onChange(
                          selectedDate && selectedTime
                            ? buildDateTime(selectedDate, selectedTime)
                            : '',
                        );
                      }}
                      error={errors.shift_end?.message}
                    />
                  )}
                />
              </div>
            </div>

            {/* Worker Information */}
            <div className="space-y-4">
              {/* <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Worker Details</h3>
            </div> */}
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={originalPhone}
                  onChange={(e) => {
                    setOriginalPhone(e.target.value);
                    if (phoneErrors.original_employee_phone) {
                      setPhoneErrors((prev) => ({ ...prev, original_employee_phone: undefined }));
                    }
                  }}
                  label="Worker Mobile Number *"
                  placeholder="+919876543210"
                  error={phoneErrors.original_employee_phone}
                />

                {shiftType === 'PRIVATE' && (
                  <Input
                    value={replacementPhone}
                    onChange={(e) => {
                      setReplacementPhone(e.target.value);
                      if (phoneErrors.replacement_employee_phone) {
                        setPhoneErrors((prev) => ({ ...prev, replacement_employee_phone: undefined }));
                      }
                    }}
                    label="Replacement Mobile"
                    placeholder="+919876543210"
                    error={phoneErrors.replacement_employee_phone}
                  />
                )}
              </div>
            </div>

            <div className="mt-2 flex justify-between">
              <div className="flex h-[50px] w-full max-w-[180px] rounded-xl border border-gray-300 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setShiftType('PUBLIC')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                    shiftType === 'PUBLIC'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Globe size={16} />
                  Public
                </button>

                <button
                  type="button"
                  onClick={() => setShiftType('PRIVATE')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg cursor-pointer text-sm font-medium transition-all ${
                    shiftType === 'PRIVATE'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Lock size={16} />
                  Private
                </button>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-blue-600 bg-white px-6 py-2.5 font-medium !text-black"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Shift Swap'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
