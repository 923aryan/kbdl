'use client';

import { FormEvent, useState } from "react";
import { submitContactForm } from "../../app/actions/contact";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const mobileInput = (formData.get('mobile') as string || "").trim();
    const data = {
      fullName: (formData.get('fullName') as string || "").trim(),
      email: (formData.get('email') as string || "").trim(),
      mobileNumber: `+91 ${mobileInput}`,
      subject: (formData.get('subject') as string || "").trim(),
      message: (formData.get('message') as string || "").trim(),
    };

    const newErrors: { [key: string]: string } = {};

    // Validation Rules
    if (!data.fullName) {
      newErrors.fullName = "Full name is required";
    } else if (data.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (/\d/.test(data.fullName)) {
      newErrors.fullName = "Full name cannot contain numbers";
    }

    if (!data.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!mobileInput) {
      newErrors.mobile = "Mobile number is required";
    } else if (mobileInput.startsWith('0')) {
      newErrors.mobile = "Mobile number cannot start with 0";
    } else if (!/^\d{10}$/.test(mobileInput)) {
      newErrors.mobile = "Please enter exactly 10 digits";
    }

    if (!data.subject) {
      newErrors.subject = "Subject is required";
    } else if (data.subject.length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    }

    if (!data.message) {
      newErrors.message = "Message is required";
    } else if (data.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    setErrors({});

    const result = await submitContactForm(data);

    setIsSubmitting(false);

    if (result.success) {
      showToast("Message sent successfully!", "success");
      (e.target as HTMLFormElement).reset();
    } else {
      showToast(result.message, "error");
    }
  };

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 md:right-8 z-50 px-6 py-3 rounded-xl shadow-lg border ${toastMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          } font-semibold transition-all duration-300 flex items-center gap-2`}>
          {toastMessage.type === 'success' ? (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toastMessage.text}
        </div>
      )}

      <h3 className="text-2xl font-extrabold text-navy mb-8">
        Send Us a Message
      </h3>

      {/* Standard HTML Form */}
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

        {/* Full Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className="text-[11px] font-bold text-navy uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
            onChange={() => clearError('fullName')}
            className={`w-full px-4 py-3.5 bg-white border rounded-xl text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${errors.fullName
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-[#0658C2]/20 focus:border-[#0658C2]'
              }`}
          />
          {errors.fullName && <span className="text-red-500 text-xs font-medium">{errors.fullName}</span>}
        </div>

        {/* Grid for Email and Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[11px] font-bold text-navy uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              onChange={() => clearError('email')}
              className={`w-full px-4 py-3.5 bg-white border rounded-xl text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${errors.email
                ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 focus:ring-[#0658C2]/20 focus:border-[#0658C2]'
                }`}
            />
            {errors.email && <span className="text-red-500 text-xs font-medium">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="mobile" className="text-[11px] font-bold text-navy uppercase tracking-wider">
              Mobile Number
            </label>
            <div className={`flex w-full bg-white border rounded-xl overflow-hidden focus-within:ring-2 transition-colors ${errors.mobile
              ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500'
              : 'border-gray-200 focus-within:ring-[#0658C2]/20 focus-within:border-[#0658C2]'
              }`}>
              <span className="px-4 py-3.5 bg-gray-50 border-r border-gray-200 text-navy font-medium select-none flex items-center justify-center">
                +91
              </span>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="XXXXXXXXXX"
                maxLength={10}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                  clearError('mobile');
                }}
                className="w-full px-4 py-3.5 text-navy placeholder:text-gray-400 focus:outline-none bg-transparent"
              />
            </div>
            {errors.mobile && <span className="text-red-500 text-xs font-medium">{errors.mobile}</span>}
          </div>
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-2">
          <label htmlFor="subject" className="text-[11px] font-bold text-navy uppercase tracking-wider">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Hiring inquiry, shift swap, partnership..."
            onChange={() => clearError('subject')}
            className={`w-full px-4 py-3.5 bg-white border rounded-xl text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors ${errors.subject
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-[#0658C2]/20 focus:border-[#0658C2]'
              }`}
          />
          {errors.subject && <span className="text-red-500 text-xs font-medium">{errors.subject}</span>}
        </div>

        {/* Message Textarea */}
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-[11px] font-bold text-navy uppercase tracking-wider">
            Your Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Tell us what you need..."
            onChange={() => clearError('message')}
            className={`w-full px-4 py-3.5 bg-white border rounded-xl text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors resize-none ${errors.message
              ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 focus:ring-[#0658C2]/20 focus:border-[#0658C2]'
              }`}
          ></textarea>
          {errors.message && <span className="text-red-500 text-xs font-medium">{errors.message}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full bg-[#0658C2] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Sending..." : "Submit Message"}
          <span aria-hidden="true" className="font-normal text-lg leading-none">→</span>
        </button>
      </form>
    </div>
  );
}