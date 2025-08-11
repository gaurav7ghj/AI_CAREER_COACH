package com.aicareercoach.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aicareercoach.model.AdviceHistory;
import com.aicareercoach.model.User;

public interface AdviceHistoryRepository extends JpaRepository<AdviceHistory, Long> {
    List<AdviceHistory> findByUser(User user);
}


