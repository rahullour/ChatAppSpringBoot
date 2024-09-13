package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/users")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("currentUser/getId")
    public ResponseEntity<Integer> getUserId(){
        return ResponseEntity.ok(userService.getCurrentUser().getId());
    }

    @GetMapping("/getId")
    public ResponseEntity<Integer> getUserId(@RequestParam String email){
        return ResponseEntity.ok(userService.getUserByEmail(email).getId());
    }

    @GetMapping("/getProfilePic")
    public ResponseEntity<String> getProfilePic(@RequestParam int id) {
        String profilePictureUrl = userService.getUserById(id).getProfilePictureUrl();
        return ResponseEntity.ok("{\"profilePicture\":\"" + profilePictureUrl + "\"}");
    }

    @GetMapping("/getUserEmails")
    public ResponseEntity<List<String>> getUserEmails(@RequestParam String q) {
        List<String> emails = userService.findEmailsByQuery(q);
        emails.remove(userService.getCurrentUser().getEmail());
        return ResponseEntity.ok(emails);
    }

    @GetMapping("/getUserNameByEmail")
    public ResponseEntity<String> getUserNameByEmail(@RequestParam String email) {
        String uName = userService.getUserByEmail(email).getUsername();
        return ResponseEntity.ok(uName);
    }

}
