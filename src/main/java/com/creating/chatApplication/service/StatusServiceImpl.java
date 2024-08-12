package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Status;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.StatusRepository;
import com.creating.chatApplication.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StatusServiceImpl implements StatusService {
    @Autowired
    private StatusRepository statusRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void setStatus(int userId, String statusMessage) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Status status = new Status();
        status.setUser(user); // Set the existing User object
        status.setStatusMessage(statusMessage);
        statusRepository.save(status);
    }


    @Override
    public List<Status> getStatusForUser(int userId) {
        return statusRepository.findByUserId(userId);
    }
}
