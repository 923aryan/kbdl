'use server';

export async function submitContactForm(data: {
  fullName: string;
  email: string;
  mobileNumber: string;
  subject: string;
  message: string;
}) {
  try {
    const apiUrl = process.env.BACKEND_API || 'http://localhost:8000/api/v1/leads/';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true, message: result.message || 'Lead created successfully' };
    } else {
      return { success: false, message: result.message || 'Failed to send message.' };
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, message: 'An error occurred. Please try again later.' };
  }
}
