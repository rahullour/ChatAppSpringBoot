package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Status;

import java.util.List;

public interface StatusService {
    void setStatus(int userId, String statusMessage);
    List<Status> getStatusForUser(int userId);
}
