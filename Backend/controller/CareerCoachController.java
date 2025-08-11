package com.aicareercoach.controller;

import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // Correct import here
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.aicareercoach.dto.AdviceHistoryDto;
import com.aicareercoach.dto.JobDto;
import com.aicareercoach.dto.UserProfileRequest;
import com.aicareercoach.model.AdviceHistory;
import com.aicareercoach.model.User;
import com.aicareercoach.repository.AdviceHistoryRepository;
import com.aicareercoach.service.CareerService;
import com.aicareercoach.service.JobService;

@RestController
@RequestMapping("/api/careers")
@CrossOrigin(origins = "http://localhost:5173")
public class CareerCoachController {

    @Autowired
    private CareerService careerService;

    @Autowired
    private AdviceHistoryRepository adviceHistoryRepository;

    @Autowired
    private JobService jobService;  // Inject the JobService bean here
    
    

    @PostMapping("/advice")
    public ResponseEntity<Map<String, String>> getCareerAdvice(@RequestBody UserProfileRequest profileRequest, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        String advice = careerService.generateAdvice(profileRequest);

        AdviceHistory history = new AdviceHistory();
        history.setUser(currentUser);
        history.setSkills(profileRequest.getSkills());
        history.setInterests(profileRequest.getInterests());
        history.setResponse(advice);
        adviceHistoryRepository.save(history);

        // Wrap the advice string in a Map and return
        return ResponseEntity.ok(Map.of("advice", advice));
    }

    @GetMapping("/history")
    public ResponseEntity<List<AdviceHistoryDto>> getAdviceHistory(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        List<AdviceHistory> historyList = adviceHistoryRepository.findByUser(currentUser);

        List<AdviceHistoryDto> dtoList = historyList.stream().map(h ->
            new AdviceHistoryDto(
                h.getId(),
                h.getSkills(),
                h.getInterests(),
                h.getResponse(),
                h.getCreatedAt()
            )
        ).toList();

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/jobs/recommend")
    public ResponseEntity<List<JobDto>> getJobs(
            @RequestParam String query,
            @RequestParam(defaultValue = "India") String location, Authentication authentication) {

        System.out.println("Authentication: " + authentication);
        System.out.println("Is authenticated: " + (authentication != null && authentication.isAuthenticated()));

        List<JobDto> jobs = jobService.getJobRecommendations(query, location);
        return ResponseEntity.ok(jobs);
    }
    
    @GetMapping("/jobs/remotive")
    public ResponseEntity<?> getRemotiveJobs(@RequestParam(defaultValue = "") String search) {
        try {
            List<JobDto> jobs = jobService.getRemotiveJobs(search);
            return ResponseEntity.ok(jobs);
        } catch (Exception e) {
            // Log and send error message
            System.out.println("Remotive jobs fetch failed: " + e.getMessage());
            return ResponseEntity.status(502) // Bad Gateway (since it's a third-party API)
                    .body(Map.of("error", e.getMessage()));
        }
    }


    	
}


