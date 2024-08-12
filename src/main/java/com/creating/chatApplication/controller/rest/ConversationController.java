package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Conversation;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.service.ConversationService;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @Autowired
    private UserService userService;

    @PostMapping
    public Conversation createConversation(@RequestBody Conversation conversation, Principal principal) {
        // Assume you have a method to get the User object from the username
        User creator = userService.getUserByUsername(principal.getName());
        return conversationService.createConversation(conversation, creator);
    }

    @GetMapping
    public List<Conversation> getUserConversations(Principal principal) {
        User user = userService.getUserByUsername(principal.getName());
        return conversationService.getUserConversations(user);
    }

    @DeleteMapping("/{id}")
    public void leaveConversation(@PathVariable int id, Principal principal) {
        User user = userService.getUserByUsername(principal.getName());
        Conversation conversation = conversationService.getConversationById(id);
        conversationService.leaveConversation(conversation, user);
    }
}
