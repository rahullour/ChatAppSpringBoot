package com.creating.chatApplication;

import com.creating.chatApplication.config.RequestUrlFilter;
import com.creating.chatApplication.service.NotificationManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
public class GlobalExceptionHandler {
    @Autowired
    private NotificationManager notificationManager;

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public String handleMaxSizeException(MaxUploadSizeExceededException exc, RedirectAttributes redirectAttributes) {
        notificationManager.sendFlashNotification("File size exceeds the maximum limit of 2 MB !", "alert-danger", "short-noty");

        // Get the current URL from the filter
        String currentUrl = RequestUrlFilter.getCurrentUrl();

        // Redirect to the current URL
        return "redirect:" + currentUrl;
    }
}
