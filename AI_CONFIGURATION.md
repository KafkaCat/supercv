# AI Configuration Guide

The "Build" (Generate) button on the Landing Page is designed to connect to an AI backend service for analyzing Job Descriptions and tailoring resumes.

## Current Status
Currently, the button simulates an API call with a 1.5s delay and then navigates to the editor with a fresh resume.

## How to Connect to Real AI Service

1. **Backend Endpoint**: You need a backend service (e.g., Python/Node.js) that accepts a Job Description string.
2. **Frontend Integration**:
   - Open `src/components/LandingPage.tsx`.
   - In `handleSubmit`, replace the `setTimeout` simulation with a real `fetch` or `axios` call.

```typescript
// Example Implementation in src/components/LandingPage.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!jd.trim()) return;
  
  setIsGenerating(true);

  try {
    // 1. Call your AI API
    const response = await fetch('https://your-api.com/analyze-jd', {
      method: 'POST',
      body: JSON.stringify({ jd }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    // 2. Pass the analyzed data to the editor
    // You might need to update onGenerate signature to accept structured data
    onGenerate(jd, data); 
    
  } catch (error) {
    console.error("AI Generation failed", error);
    alert("Failed to generate resume. Please try again.");
  } finally {
    setIsGenerating(false);
  }
};
```

3. **Data Mapping**:
   - Ensure the API response matches the `Resume` interface defined in `src/types.ts`.
   - Update `useResumeStore.ts` to populate the new resume with this data.
