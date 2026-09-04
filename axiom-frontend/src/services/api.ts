// src/services/api.ts

// Direct backend URL - NO proxy!
const API_BASE_URL = 'https://axiom-ai-xcv0.onrender.com';  // YOUR Render URL

// Verify Code
export const verifyCode = async (oldCode: string, newCode: string) => {
  try {
    console.log('Sending code verification request to:', `${API_BASE_URL}/verify-code`);
    
    const response = await fetch(`${API_BASE_URL}/verify-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_code: oldCode,
        new_code: newCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Code verification response:', data);
    return data;
  } catch (error) {
    console.error('Code verification failed:', error);
    throw error;
  }
};

// Verify Claims
export const verifyClaims = async (
  claimsOrText: string,
  sources: Array<{
    name: string;
    text: string;
    doc_type: string;
    published_date: string;
  }>
) => {
  try {
    console.log('Sending claims verification request to:', `${API_BASE_URL}/verify-claims`);
    
    const response = await fetch(`${API_BASE_URL}/verify-claims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        claims_or_text: claimsOrText,
        sources: sources,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Claims verification response:', data);
    return data;
  } catch (error) {
    console.error('Claims verification failed:', error);
    throw error;
  }
};