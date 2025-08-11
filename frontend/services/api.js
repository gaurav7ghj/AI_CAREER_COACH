const API_BASE_URL = "/api";

// Helper function for API requests with error handling and auth token
async function apiFetch(url, options = {}) {
  if (!options.headers) options.headers = {};
  
  try {
    const token = localStorage.getItem("jwt");
    if (token) options.headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {
    // Ignore token read errors
  }

 const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    } catch {}
    if (response.status === 401) {
      localStorage.removeItem("jwt");
      errorMessage = "Authentication failed. Please login again.";
    } else if (response.status === 403) {
      errorMessage = "Access denied. You do not have permission.";
    } else if (response.status === 404) {
      errorMessage = "API endpoint not found.";
    } else if (response.status === 500) {
      errorMessage = "Server error. Please try again later.";
    }
    throw new Error(errorMessage);
  }
  return response.json();
}


// Authentication APIs
export async function loginUser(credentials) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    let errorMessage = `Login failed with status ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    } catch {}
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

export async function registerUser(user) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  
  if (!response.ok) {
    let errorMessage = `Registration failed with status ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) errorMessage = errorText;
    } catch {}
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

// Career advice APIs - Corrected endpoint path
export async function getCareerAdvice(params) {
  return apiFetch("/careers/advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function getAdviceHistory() {
  return apiFetch("/careers/history");
}

// Job APIs
export async function fetchRemotiveJobs(search = "") {
  const response = await fetch(`/api/careers/jobs/remotive?search=${encodeURIComponent(search)}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch remotive jobs");
  }
  return response.json();
}

// Mock Interview APIs
export async function getInterviewQuestions(role, skills, num = 5) {
  const token = localStorage.getItem("jwt");

  const response = await fetch('/api/ai/generate-questions', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify({ role, skills, num }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch interview questions");
  }

  const data = await response.json();
  return data.questions; // Adjust according to your backend response structure
}
export async function getFeedback(question, answer, role, skills) {
  return apiFetch("/ai/evaluate-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, answer, role, skills }),
  });
}
export async function generateResume(data) {
  return apiFetch("/ai/generate-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function generateLinkedInSummary(data) {
  return apiFetch("/ai/generate-linkedin-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
