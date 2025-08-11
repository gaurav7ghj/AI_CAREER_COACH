package com.aicareercoach.controller;

import java.util.List;
import java.util.Map;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;
    
    

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private final RestTemplate restTemplate = new RestTemplate();


    @PostMapping("/generate-resume")
    public ResponseEntity<?> generateResume(@RequestBody Map<String, String> payload) {
        String name = payload.getOrDefault("name", "");
        String email = payload.getOrDefault("email", "");
        String phone = payload.getOrDefault("phone", "");
        String summary = payload.getOrDefault("summary", "");
        String skills = payload.getOrDefault("skills", "");
        String experiences = payload.getOrDefault("experiences", "");

        String prompt = """
You are a rÃƒÂ©sumÃƒÂ© expert. Given ONLY the information below, generate a professional, fully filled-out rÃƒÂ©sumÃƒÂ© as a valid JSON object.

**Important rules:**
- Only use the user's provided full name exactly as enteredÃ¢â‚¬â€do NOT invent surnames or other names.
- Output skills as an array of strings.
- Output experience as an array of objects: { "title", "company", "dates", "bullets": [...] }(date,location,job title, company must be user provided as it is.)
- Output education as an array of objects: { "degree", "institution", "dates" }(date,location,job title, company must be user provided as it is.).also in education user provided degree and institution is constant.
- For missing data, use realistic industry-standard filler examples (not 'null' or empty).
- Only output a valid JSON object. Do NOT include any commentary, markdown, or text outside the JSON.

The JSON model:
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "location": "City, State or blank if not given",
  "summary": "...",
  "skills": ["...", "..."],
  "experience": [
    {
      "title": "...",
      "company": "...",
      "dates": "...",
      "bullets": ["...", "..."]
    }
  ],
  "education": [
    {
      "degree": "...",
      "institution": "...",
      "dates": "..."
    }
  ],
  "projects": [
    {
      "project Name": "...",
      "Description": "...",
      "Technologies": ["..."]
      "Link": ["..."]
    }
  ]
}

User data:
Name: %s
Email: %s
Phone: %s
Summary: %s
Skills: %s
Experiences: %s
""".formatted(name, email, phone, summary, skills, experiences);

        try {
            String generatedText = callGeminiAPI(prompt);

            String cleanedJson = generatedText.trim();

            if (cleanedJson.startsWith("```")){
                cleanedJson = cleanedJson.substring(3, cleanedJson.length() - 3).trim();
            } else if (cleanedJson.startsWith("`") && cleanedJson.endsWith("`")) {
                cleanedJson = cleanedJson.substring(1, cleanedJson.length() - 1).trim();
            }

            int start = cleanedJson.indexOf("{");
            int end = cleanedJson.lastIndexOf("}");
            if (start != -1 && end != -1 && end > start) {
                cleanedJson = cleanedJson.substring(start, end + 1);
            }

            Map<String, Object> parsedJson = objectMapper.readValue(cleanedJson, Map.class);

            return ResponseEntity.ok(parsedJson);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "AI generation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chatWithAI(@RequestBody Map<String, Object> payload) {
        String userMessage = (String) payload.getOrDefault("message", "");
        List<Map<String, Object>> conversationHistory = (List<Map<String, Object>>) payload.get("history");

        if (userMessage.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
        }

        // Build conversation context
        StringBuilder contextBuilder = new StringBuilder();
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            contextBuilder.append("Previous conversation context:\n");
            for (Map<String, Object> msg : conversationHistory) {
                String sender = (String) msg.get("sender");
                String text = (String) msg.get("text");
                contextBuilder.append(sender.equals("user") ? "User: " : "Assistant: ").append(text).append("\n");
            }
            contextBuilder.append("\n");
        }

        String prompt = """
You are an expert AI Career Coach and Assistant. You help users with:
- Career advice and guidance
- Job search strategies  
- Resume and cover letter tips
- Interview preparation
- Skill development recommendations
- Industry insights
- Salary negotiation
- Career transitions
- Professional development

IMPORTANT:
- Keep responses concise and actionable (maximum 8 bullet points or 12 lines)
- Use markdown formatting for better readability (bullets, bold, code blocks, tables when helpful)
- Be encouraging and supportive but brief
- If the user asks about something outside career topics, politely redirect
- Consider the conversation context to provide relevant follow-ups

%s
Current user message: %s

Provide a helpful, concise response with markdown formatting:
""".formatted(contextBuilder.toString(), userMessage);

        try {
            String aiResponse = callGeminiAPI(prompt);

            String cleanedResponse = aiResponse.trim();

            if (cleanedResponse.startsWith("```")) {
                int firstNewline = cleanedResponse.indexOf('\n');
                int lastTripleBacktick = cleanedResponse.lastIndexOf("```");
                if (firstNewline != -1 && lastTripleBacktick > firstNewline) {
                    cleanedResponse = cleanedResponse.substring(firstNewline + 1, lastTripleBacktick).trim();
                }
            }

            return ResponseEntity.ok(Map.of("reply", cleanedResponse));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get AI response: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-analyze")
    public ResponseEntity<Map<String, Object>> uploadAndAnalyze(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));
            }

            String fileName = file.getOriginalFilename();
            String fileType = file.getContentType();
            String extractedText = "";

            if (fileType != null && fileType.equals("application/pdf")) {
                try (PDDocument document = PDDocument.load(file.getInputStream())) {
                    PDFTextStripper pdfStripper = new PDFTextStripper();
                    extractedText = pdfStripper.getText(document);
                    if (extractedText.length() > 6000) {
                        extractedText = extractedText.substring(0, 6000) + "...";
                    }
                } catch (Exception ex) {
                    extractedText = "Unable to extract text from PDF. (" + ex.getMessage() + ")";
                }
            } else if (fileType != null && fileType.equals("text/plain")) {
                extractedText = new String(file.getBytes());
            } else {
                extractedText = "File uploaded: " + fileName + " (" + fileType + ")";
            }

            String prompt = """
You are an expert career coach. I've uploaded a document for analysis. Please review it and provide:

1. **Document Type**: What type of document this appears to be (resume, cover letter, job posting, etc.)
2. **Key Strengths**: What are the main strengths or positive aspects?
3. **Areas for Improvement**: What could be enhanced or improved?
4. **Specific Recommendations**: 3-5 actionable suggestions

Document content:
%s

Provide your analysis in markdown format:
""".formatted(extractedText);

            String aiResponse = callGeminiAPI(prompt);
            return ResponseEntity.ok(Map.of("reply", aiResponse.trim()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to analyze document: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-cover-letter")
    public ResponseEntity<Map<String, Object>> generateCoverLetter(@RequestBody Map<String, Object> payload) {
        String jobTitle = (String) payload.getOrDefault("jobTitle", "");
        String company = (String) payload.getOrDefault("company", "");
        String jobDescription = (String) payload.getOrDefault("jobDescription", "");
        String resumeData = (String) payload.getOrDefault("resumeData", "");
        String personalInfo = (String) payload.getOrDefault("personalInfo", "");

        String prompt = """
You are a professional cover letter writer. Create a compelling, personalized cover letter based on the information provided.

**Requirements:**
- Professional tone and structure
- Highlight relevant skills and experience from the resume
- Show enthusiasm for the specific role and company
- Keep it concise (3-4 paragraphs)
- Include proper formatting

**Job Information:**
Position: %s
Company: %s
Job Description: %s

**Candidate Information:**
Personal Details: %s
Resume/Experience: %s

Generate a professional cover letter:
""".formatted(jobTitle, company, jobDescription, personalInfo, resumeData);

        try {
            String aiResponse = callGeminiAPI(prompt);
            return ResponseEntity.ok(Map.of("coverLetter", aiResponse.trim()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate cover letter: " + e.getMessage()));
        }
    }

    @PostMapping("/mock-interview")
    public ResponseEntity<Map<String, Object>> mockInterview(@RequestBody Map<String, Object> payload) {
        String action = (String) payload.getOrDefault("action", "start");
        String jobRole = (String) payload.getOrDefault("jobRole", "Software Engineer");
        String userAnswer = (String) payload.getOrDefault("answer", "");
        String currentQuestion = (String) payload.getOrDefault("currentQuestion", "");

        String prompt = "";
        if ("start".equals(action)) {
            prompt = """
You are conducting a mock interview for a %s position. 

Start the interview by:
1. Greeting the candidate warmly
2. Asking the first interview question (choose from behavioral, technical, or situational based on the role)
3. Providing context for what you're looking for in the answer

Format your response as:
**Interviewer:** [Your greeting and question]

**Looking for:** [Brief note on what makes a good answer]
""".formatted(jobRole);
        } else if ("feedback".equals(action)) {
            prompt = """
You are an interview coach providing feedback on this answer:

**Question:** %s
**Candidate's Answer:** %s

Provide:
also add some bullets points in answer that is kinda readable format .
1. **Feedback:** Specific feedback on the answer (2-3 sentences)
2. **Score:** Rate the answer from 1-10
3. **Improvement Tips:** 1-2 specific ways to improve
4. **Next Question:** Ask the next interview question for a %s role

Format your response with clear sections.
""".formatted(currentQuestion, userAnswer, jobRole);
        }

        try {
            String aiResponse = callGeminiAPI(prompt);
            return ResponseEntity.ok(Map.of("response", aiResponse.trim()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to process mock interview: " + e.getMessage()));
        }
    }
    @PostMapping("/generate-linkedin-summary")
    public ResponseEntity<?> generateLinkedInSummary(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.getOrDefault("name", "");
            String summary = (String) payload.getOrDefault("summary", "");
            String skills = (String) payload.getOrDefault("skills", "");

            String prompt = """
                Generate a professional and concise LinkedIn "About" summary based on the following user data.
                Use the data exactly as provided. Do not invent or exaggerate details.

                Name: %s
                Summary: %s
                Skills (comma separated): %s

                Write the LinkedIn summary only.
                """.formatted(name, summary, skills);

            String generatedText = callGeminiAPI(prompt);
            String cleanedText = cleanAIResponse(generatedText);

            return ResponseEntity.ok(Map.of("summary", cleanedText));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to generate LinkedIn summary: " + e.getMessage()));
        }
    }

    @PostMapping("/generate-questions")
    public ResponseEntity<Map<String, Object>> generateQuestions(@RequestBody Map<String, Object> payload) {
        String role = (String) payload.getOrDefault("role", "Software Engineer");
        String skills = (String) payload.getOrDefault("skills", "");
        Object numObj = payload.get("num");
        int num = 5; // default value
        if (numObj != null) {
            if (numObj instanceof Integer) {
                num = (Integer) numObj;
            } else if (numObj instanceof String) {
                try {
                    num = Integer.parseInt((String) numObj);
                } catch (NumberFormatException e) {
                    // keep default
                    num = 5;
                }
            } else if (numObj instanceof Number) {
                num = ((Number) numObj).intValue();
            }
        }

        String prompt = String.format("Generate %d interview questions for a %s skilled in %s. Return a list of concise questions.", num, role, skills);

        try {
            String response = callGeminiAPI(prompt);
            System.out.println("Gemini API response for questions:\n" + response);

            List<String> questions = List.of(response.split("\n"));
            return ResponseEntity.ok(Map.of("questions", questions));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/evaluate-answer")
    public ResponseEntity<Map<String, Object>> evaluateAnswer(@RequestBody Map<String, Object> payload) {
        String question = (String) payload.get("question");
        String answer = (String) payload.get("answer");
        String role = (String) payload.getOrDefault("role", "Software Engineer");
        String skills = (String) payload.getOrDefault("skills", "");

        String prompt = String.format("You are an expert interviewer. Evaluate this answer to the question: '%s' for a '%s' role with skills '%s'. Give concise, actionable feedback., use some bullets points .", question, role, skills)
                + "\nAnswer: " + answer;

        try {
            String feedback = callGeminiAPI(prompt);
            return ResponseEntity.ok(Map.of("feedback", feedback));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    
  
    @SuppressWarnings("unchecked")
    private String callGeminiAPI(String prompt) throws Exception {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("x-goog-api-key", geminiApiKey);

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentPart = Map.of("parts", new Object[] { textPart });
        Map<String, Object> requestBody = Map.of("contents", new Object[] { contentPart });

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        Map<String, Object> response = restTemplate.postForObject(apiUrl, request, Map.class);

        if (response != null && response.containsKey("candidates")) {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            for (Map<String, Object> candidate : candidates) {
                Object contentObj = candidate.get("content");
                if (contentObj instanceof Map) {
                    Map<String, Object> contentMap = (Map<String, Object>) contentObj;
                    Object partsObj = contentMap.get("parts");
                    if (partsObj instanceof List) {
                        for (Object partObj : (List<?>) partsObj) {
                            if (partObj instanceof Map) {
                                Object text = ((Map<?, ?>) partObj).get("text");
                                if (text instanceof String) {
                                    return (String) text;
                                }
                            }
                        }
                    }
                }
            }
        }
        throw new Exception("No content generated from Gemini API");
    }
    private String cleanAIResponse(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")){
            cleaned = cleaned.replaceFirst("^```[a-zA-Z]*\\n?", "")  // Remove opening ```
                              .replaceFirst("\\n?```$", "");      // Remove closing ```
        } else if (cleaned.startsWith("`") && cleaned.endsWith("`")) {
            cleaned = cleaned.substring(1, cleaned.length()-1).trim();
        }
        int start = cleaned.indexOf("{");
        int end = cleaned.lastIndexOf("}");
        if (start != -1 && end != -1 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        return cleaned;
    }
}
