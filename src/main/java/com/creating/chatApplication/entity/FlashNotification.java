package com.creating.chatApplication.entity;

public class FlashNotification {
    private String message;
    private String type;
    private String duration_type;

    // Constructor
    public FlashNotification(String message, String type, String duration_type) {
        this.message = message;
        this.type = type;
        this.duration_type = duration_type;
    }

    // Copy constructor
    public FlashNotification(FlashNotification other) {
        this.message = other.message;
        this.type = other.type;
        this.duration_type = other.duration_type;
    }

    // Getters and Setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDuration_type() {
        return duration_type;
    }

    public void setDuration_type(String duration_type) {
        this.duration_type = duration_type;
    }
}
