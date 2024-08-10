package com.creating.chatApplication.controller.mvc;

import com.creating.chatApplication.service.NotificationManager;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AppMVCController {

    private NotificationManager notificationManager;
    @GetMapping("/")
    public String home(Model model){
        String notificationMessage = notificationManager.getNotification();
        model.addAttribute("notificationMessage", notificationMessage);
        notificationManager.clearNotification();
        return "home";
    }

    @GetMapping("/loginPage")
    public String login(){
        notificationManager.clearNotification();
        return "login";
    }

    @GetMapping("/access-denied")
    public String deniedAccess(){
        return "access-denied";
    }
}