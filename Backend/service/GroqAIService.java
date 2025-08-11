package com.aicareercoach.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

@Service
public class GroqAIService {

    @Value("${groq.api.key}")
    private String apiKey;
    @Value("${groq.api.url}")
    private String apiUrl;

    private final WebClient webClient = WebClient.builder().build();

    public String getAdvice(String prompt) {
        Map<String, Object> requestBody = Map.of(
            "model", "llama3-70b-8192", // example, check Groq for available models
            "messages", java.util.List.of(
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 512
        );

        try {
            GroqAIResponse result = webClient.post()
                .uri(apiUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(GroqAIResponse.class)
                .block();

            if(result != null && !result.choices.isEmpty()) {
                return result.choices.get(0).message.content;
            } else {
                return "No advice received from Groq.";
            }
        } catch(Exception e) {
            return "Error contacting Groq API: " + e.getMessage();
        }
    }

    // Nested static classes to map response
    public static class GroqAIResponse {
        public java.util.List<Choice> choices;
        public static class Choice {
            public Message message;
            public static class Message {
                public String content;
            }
        }
    }
}
