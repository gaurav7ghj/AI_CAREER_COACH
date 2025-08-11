package com.aicareercoach.service;

import com.aicareercoach.dto.UserProfileRequest;

import com.aicareercoach.model.UserProfile;
import com.aicareercoach.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CareerService {

    @Autowired
    private UserProfileRepository userProfileRepository;
    
    @Autowired private GroqAIService groqAIService;

 // Change your generateAdvice method:
    public String generateAdvice(UserProfileRequest profileRequest) {
        String prompt = "Give career advice for skills: " + profileRequest.getSkills() +
                ", interests: " + profileRequest.getInterests();
        return groqAIService.getAdvice(prompt);
    }
}
