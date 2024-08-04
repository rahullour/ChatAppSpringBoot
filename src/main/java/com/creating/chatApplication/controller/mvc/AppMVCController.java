package com.creating.chatApplication.controller.mvc;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AppMVCController {

    @GetMapping("/")
    public String home(){
        return "home";
    }

    @GetMapping("/loginPage")
    public String login(){
        return "login";
    }

    @GetMapping("/access-denied")
    public String deniedAccess(){
        return "access-denied";
    }
}