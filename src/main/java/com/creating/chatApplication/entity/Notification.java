package com.creating.chatApplication.entity;

public class Notification {
    private String message;
    private String type;

    public Notification(String message, String type) {
        this.message = message;
        this.type = type;
    }

    // Getters
    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }
}
