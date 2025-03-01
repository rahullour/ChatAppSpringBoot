package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.*;
import com.creating.chatApplication.service.UserGroupService;
import com.creating.chatApplication.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailSendException;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;

@RequestMapping("/api/users")
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserGroupService userGroupService;


    @GetMapping("currentUser/getId")
    public ResponseEntity<Integer> getUserId(){
        return ResponseEntity.ok(userService.getCurrentUser().getId());
    }

    @GetMapping("getUsername")
    public ResponseEntity<String> getUserName(@RequestParam int id){
        return ResponseEntity.ok(userService.getUserNameById(id));
    }

    @GetMapping("/getId")
    public ResponseEntity<Integer> getUserId(@RequestParam String email){
        return ResponseEntity.ok(userService.getUserByEmail(email).getId());
    }

    @GetMapping("/getEmail")
    public ResponseEntity<String> getUserEmail(@RequestParam int id){
        return ResponseEntity.ok(userService.getUserById(id).getEmail());
    }

    @GetMapping("/getProfilePic")
    public ResponseEntity<String> getProfilePic(@RequestParam int id) {
        String profilePictureUrl = userService.getUserById(id).getProfilePictureUrl();
        return ResponseEntity.ok("{\"profilePicture\":\"" + profilePictureUrl + "\"}");
    }

    @GetMapping("/getProfilePicByRoomId")
    public ResponseEntity<String> getProfilePicByRoomId(@RequestParam String roomId) {
        String profilePictureUrl = userGroupService.findUserGroupByRoomId(roomId).getProfilePictureUrl();
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

    @PostMapping("/setProfilePic")
    public void setProfilePic(@RequestParam MultipartFile profilePicture) {

    }

}
